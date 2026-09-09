import Link from "next/link";
import { Compass, Hash, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { shapeStatus, statusInclude } from "@/lib/status-shape";
import { StatusCard } from "@/components/feed/status-card";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/follow-button";
import { initials } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { tierClass } from "@/lib/tier-style";

export const metadata = { title: "Jelajah" };
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const me = await getCurrentUser();
  const now = Date.now();

  const [tags, hotThreads, hotStatuses, iFollowRows] = await Promise.all([
    prisma.hashtag.findMany({
      where: { lastUsedAt: { gte: new Date(now - 14 * 86400000) } },
      orderBy: [{ count: "desc" }, { lastUsedAt: "desc" }],
      take: 12,
    }),
    prisma.thread.findMany({
      where: {
        deletedAt: null,
        lastPostAt: { gte: new Date(now - 7 * 86400000) },
      },
      orderBy: [{ views: "desc" }, { lastPostAt: "desc" }],
      take: 6,
      include: { category: true, _count: { select: { posts: true } } },
    }),
    prisma.status.findMany({
      where: {
        deletedAt: null,
        repostOfId: null,
        createdAt: { gte: new Date(now - 2 * 86400000) },
      },
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
      take: 6,
      include: statusInclude(me?.id),
    }),
    me
      ? prisma.follow.findMany({
          where: { followerId: me.id },
          select: { followingId: true },
        })
      : Promise.resolve([]),
  ]);

  // Saran akun: di-follow oleh orang yang aku follow, tapi belum aku follow.
  const iFollow = new Set(iFollowRows.map((r) => r.followingId));
  let suggested: {
    username: string;
    name: string | null;
    image: string | null;
    tier: string;
    mutual: number;
  }[] = [];

  if (me && iFollow.size > 0) {
    const rows = await prisma.follow.findMany({
      where: { followerId: { in: [...iFollow] } },
      select: {
        following: {
          select: { id: true, username: true, name: true, image: true, tier: true, bannedAt: true },
        },
      },
    });
    const tally = new Map<string, { u: (typeof rows)[0]["following"]; n: number }>();
    for (const r of rows) {
      const u = r.following;
      if (u.id === me.id || iFollow.has(u.id) || u.bannedAt) continue;
      const cur = tally.get(u.id) ?? { u, n: 0 };
      cur.n++;
      tally.set(u.id, cur);
    }
    suggested = [...tally.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)
      .map(({ u, n }) => ({
        username: u.username,
        name: u.name,
        image: u.image,
        tier: u.tier,
        mutual: n,
      }));
  }
  if (suggested.length < 6) {
    const top = await prisma.user.findMany({
      where: {
        bannedAt: null,
        ...(me ? { id: { notIn: [me.id, ...iFollow] } } : {}),
      },
      orderBy: { points: "desc" },
      take: 6 - suggested.length,
      select: { username: true, name: true, image: true, tier: true },
    });
    suggested.push(...top.map((u) => ({ ...u, mutual: 0 })));
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Compass className="h-6 w-6 text-primary" /> Jelajah
      </h1>

      {tags.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Hash className="h-4 w-4" /> Tag populer
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/tag/${t.tag}`}
                className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
              >
                #{t.tag}{" "}
                <span className="text-xs text-muted-foreground">{t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {suggested.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Saran diikuti</h2>
          <Card className="divide-y">
            {suggested.map((u) => (
              <div key={u.username} className="flex items-center gap-3 p-3">
                <Link href={`/u/${u.username}`}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.image ?? undefined} />
                    <AvatarFallback>{initials(u.name ?? u.username)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${u.username}`} className="text-sm font-medium hover:underline">
                    {u.name ?? u.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    @{u.username}
                    {u.mutual > 0 && ` · ${u.mutual} teman mengikuti`}
                  </p>
                </div>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] ${tierClass(u.tier)}`}>
                  {u.tier}
                </span>
                <FollowButton username={u.username} initialFollowing={false} loggedIn={!!me} />
              </div>
            ))}
          </Card>
        </section>
      )}

      {hotThreads.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-4 w-4" /> Thread ramai
          </h2>
          <Card className="divide-y">
            {hotThreads.map((t) => (
              <Link
                key={t.id}
                href={`/forum/${t.category.slug}/${t.slug}`}
                className="block p-3 hover:bg-accent/50"
              >
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.category.name} · {t.views} dilihat · {timeAgo(t.lastPostAt)}
                </p>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {hotStatuses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Status trending</h2>
          {hotStatuses.map((st) => (
            <StatusCard
              key={st.id}
              status={shapeStatus(st, me)}
              currentUsername={me?.username ?? null}
              canModerate={false}
            />
          ))}
        </section>
      )}
    </div>
  );
}
