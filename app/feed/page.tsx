import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { StatusComposer } from "@/components/feed/status-composer";
import { FeedList } from "@/components/feed/feed-list";
import { shapeStatus } from "@/lib/status-shape";

export const metadata = { title: "Feed" };
export const dynamic = "force-dynamic";

const PAGE = 15;

export default async function FeedPage() {
  const user = await getCurrentUser();

  const rows = await prisma.status.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: PAGE + 1,
    include: {
      author: {
        select: { username: true, name: true, image: true, role: true, tier: true },
      },
      images: { orderBy: { position: "asc" } },
      likes: user ? { where: { userId: user.id }, select: { id: true } } : false,
      _count: { select: { likes: true, comments: true } },
    },
  });

  const nextCursor = rows.length > PAGE ? rows[PAGE].id : null;
  const items = rows.slice(0, PAGE).map((s) => shapeStatus(s, user));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Feed</h1>
      </div>

      {user ? (
        <StatusComposer user={user} />
      ) : (
        <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
          <Button asChild size="sm">
            <Link href="/login?callbackUrl=/feed">Masuk untuk posting status</Link>
          </Button>
        </div>
      )}

      <FeedList
        initialItems={items}
        initialCursor={nextCursor}
        currentUsername={user?.username ?? null}
        canModerate={hasRole(user, "MODERATOR")}
      />
    </div>
  );
}
