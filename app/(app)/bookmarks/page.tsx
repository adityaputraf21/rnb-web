import Link from "next/link";
import { Bookmark } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
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
          author: { select: { username: true, name: true } },
          _count: { select: { posts: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Bookmark</h1>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada thread yang di-bookmark.
        </p>
      )}
      <Card className="divide-y">
        {items
          .filter((b) => !b.thread.deletedAt)
          .map((b) => (
            <Link
              key={b.id}
              href={`/forum/${b.thread.category.slug}/${b.thread.slug}`}
              className="block p-3 hover:bg-accent/50"
            >
              <p className="font-medium">{b.thread.title}</p>
              <p className="text-xs text-muted-foreground">
                {b.thread.category.name} · {b.thread._count.posts} pos ·{" "}
                {timeAgo(b.thread.lastPostAt)}
              </p>
            </Link>
          ))}
      </Card>
    </div>
  );
}
