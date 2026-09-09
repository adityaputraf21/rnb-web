import Link from "next/link";
import { Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusCard } from "@/components/feed/status-card";
import { shapeStatus, statusInclude } from "@/lib/status-shape";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Bookmark" };
export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await requireUser("/bookmarks");

  const items = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      thread: {
        include: {
          category: true,
          _count: { select: { posts: true } },
        },
      },
      status: { include: statusInclude(user.id) },
    },
  });

  const threads = items.filter((b) => b.thread && !b.thread.deletedAt);
  const statuses = items.filter((b) => b.status && !b.status.deletedAt);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Bookmark</h1>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada yang disimpan.</p>
      )}

      {threads.length > 0 && (
        <Card className="divide-y">
          {threads.map((b) => (
            <Link
              key={b.id}
              href={`/forum/${b.thread!.category.slug}/${b.thread!.slug}`}
              className="block p-3 hover:bg-accent/50"
            >
              <p className="font-medium">{b.thread!.title}</p>
              <p className="text-xs text-muted-foreground">
                {b.thread!.category.name} · {b.thread!._count.posts} pos ·{" "}
                {timeAgo(b.thread!.lastPostAt)}
              </p>
            </Link>
          ))}
        </Card>
      )}

      <div className="space-y-3">
        {statuses.map((b) => (
          <StatusCard
            key={b.id}
            status={shapeStatus(b.status!, user)}
            currentUsername={user.username}
            canModerate={false}
          />
        ))}
      </div>
    </div>
  );
}
