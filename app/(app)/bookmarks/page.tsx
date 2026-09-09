import Link from "next/link";
import { Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusCard } from "@/components/feed/status-card";
import { FolderBar } from "@/components/bookmarks/folder-bar";
import { MoveMenu } from "@/components/bookmarks/move-menu";
import { shapeStatus, statusInclude } from "@/lib/status-shape";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Bookmark" };
export const dynamic = "force-dynamic";

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const user = await requireUser("/bookmarks");
  const { folder } = await searchParams;
  const active = folder ?? null;

  const [rawItems, folders] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId: user.id,
        ...(active === "none"
          ? { folderId: null }
          : active
            ? { folderId: active }
            : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        thread: {
          include: { category: true, _count: { select: { posts: true } } },
        },
        status: { include: statusInclude(user.id) },
      },
    }),
    prisma.bookmarkFolder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { bookmarks: true } } },
    }),
  ]);

  const [total, uncategorized] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.bookmark.count({ where: { userId: user.id, folderId: null } }),
  ]);

  const items = rawItems.filter(
    (b) =>
      (b.thread && !b.thread.deletedAt) || (b.status && !b.status.deletedAt),
  );
  const threads = items.filter((b) => b.thread);
  const statuses = items.filter((b) => b.status);

  const folderList = folders.map((f) => ({
    id: f.id,
    name: f.name,
    count: f._count.bookmarks,
  }));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Bookmark</h1>
      </div>

      <FolderBar
        folders={folderList}
        active={active}
        total={total}
        uncategorized={uncategorized}
      />

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada yang disimpan di sini.
        </p>
      )}

      {threads.length > 0 && (
        <Card className="divide-y">
          {threads.map((b) => (
            <div key={b.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/forum/${b.thread!.category.slug}/${b.thread!.slug}`}
                  className="block hover:underline"
                >
                  <p className="font-medium">{b.thread!.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.thread!.category.name} · {b.thread!._count.posts} pos ·{" "}
                    {timeAgo(b.thread!.lastPostAt)}
                  </p>
                </Link>
                <MoveMenu
                  folders={folderList}
                  currentFolderId={b.folderId}
                  target={{ threadId: b.threadId! }}
                />
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="space-y-3">
        {statuses.map((b) => (
          <div key={b.id} className="space-y-1">
            <div className="flex justify-end">
              <MoveMenu
                folders={folderList}
                currentFolderId={b.folderId}
                target={{ statusId: b.statusId! }}
              />
            </div>
            <StatusCard
              status={shapeStatus(b.status!, user)}
              currentUsername={user.username}
              canModerate={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
