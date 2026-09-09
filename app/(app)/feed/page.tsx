import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { blockedIdsFor } from "@/lib/blocks";
import { Button } from "@/components/ui/button";
import { StatusComposer } from "@/components/feed/status-composer";
import { FeedList } from "@/components/feed/feed-list";
import { StoriesBar } from "@/components/stories/stories-bar";
import { shapeStatus, statusInclude } from "@/lib/status-shape";

export const metadata = { title: "Feed" };
export const dynamic = "force-dynamic";

const PAGE = 15;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const { filter, sort } = await searchParams;
  const user = await getCurrentUser();

  let authorWhere = {};
  if (filter === "following" && user) {
    const f = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });
    authorWhere = { authorId: { in: [...f.map((x) => x.followingId), user.id] } };
  }
  const hidden = user ? await blockedIdsFor(user.id) : new Set<string>();

  const rows = await prisma.status.findMany({
    where: {
      deletedAt: null,
      ...authorWhere,
      ...(hidden.size && !("authorId" in authorWhere)
        ? { authorId: { notIn: [...hidden] } }
        : {}),
    },
    orderBy:
      sort === "top"
        ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: PAGE + 1,
    include: statusInclude(user?.id),
  });

  const nextCursor = rows.length > PAGE ? rows[PAGE].id : null;
  const items = rows.slice(0, PAGE).map((s) => shapeStatus(s, user));

  const tab = (f: string | undefined, s: string | undefined, label: string) => {
    const active = (filter ?? "") === (f ?? "") && (sort ?? "") === (s ?? "");
    const qs = new URLSearchParams();
    if (f) qs.set("filter", f);
    if (s) qs.set("sort", s);
    return (
      <Button
        key={label}
        variant={active ? "secondary" : "ghost"}
        size="sm"
        asChild
      >
        <Link href={`/feed${qs.toString() ? `?${qs}` : ""}`}>{label}</Link>
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Feed</h1>
      </div>

      <StoriesBar
        loggedIn={!!user}
        myAvatar={user?.image}
        myUsername={user?.username}
        myName={user?.name}
      />

      {user ? (
        <StatusComposer user={user} />
      ) : (
        <div className="rounded-xl border bg-card p-4 text-center">
          <Button asChild size="sm">
            <Link href="/login?callbackUrl=/feed">Masuk untuk posting status</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {tab(undefined, undefined, "Terbaru")}
        {tab(undefined, "top", "Terpopuler")}
        {user && tab("following", undefined, "Mengikuti")}
      </div>

      <FeedList
        initialItems={items}
        initialCursor={nextCursor}
        query={`filter=${filter ?? ""}&sort=${sort ?? ""}`}
        currentUsername={user?.username ?? null}
        canModerate={hasRole(user, "MODERATOR")}
      />
    </div>
  );
}
