import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Circle, Pencil, CalendarDays, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { StatusCard } from "@/components/feed/status-card";
import { shapeStatus, statusInclude } from "@/lib/status-shape";
import { hasRole } from "@/lib/auth-helpers";
import { FollowButton } from "@/components/follow-button";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { activityHeatmap } from "@/lib/heatmap";
import { initials } from "@/lib/utils";
import { timeAgo, fullDate } from "@/lib/format";
import { tierClass, ROLE_LABEL, ROLE_BADGE } from "@/lib/tier-style";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}` };
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const me = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      _count: {
        select: { threads: true, posts: true },
      },
      achievements: { orderBy: { earnedAt: "desc" } },
      threads: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { category: true, _count: { select: { posts: true } } },
      },
      posts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { thread: { include: { category: true } } },
      },
    },
  });
  if (!user) notFound();

  const [
    rank,
    reactionsReceived,
    statusRows,
    followerCount,
    followingCount,
    iFollow,
    heat,
  ] = await Promise.all([
    prisma.user
      .count({ where: { points: { gt: user.points } } })
      .then((n) => n + 1),
    prisma.reaction.count({ where: { post: { authorId: user.id } } }),
    prisma.status.findMany({
      where: { authorId: user.id, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: statusInclude(me?.id),
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    me
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: me.id,
              followingId: user.id,
            },
          },
        })
      : null,
    activityHeatmap(user.id),
  ]);
  const statuses = statusRows.map((s) => shapeStatus(s, me));

  const online =
    !!user.lastSeenAt && Date.now() - user.lastSeenAt.getTime() < 5 * 60000;
  const isMe = me?.id === user.id;
  const earnedKeys = new Set(user.achievements.map((a) => a.key));

  return (
    <div className="mx-auto max-w-3xl">
      {/* Banner */}
      <div
        className="relative h-40 overflow-hidden rounded-2xl sm:h-52"
        style={
          user.bannerImage
            ? {
                backgroundImage: `url(${user.bannerImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `linear-gradient(135deg, ${user.bannerColor ?? "hsl(var(--primary))"}, ${
                  user.bannerColor ? `${user.bannerColor}88` : "hsl(var(--primary)/0.55)"
                })`,
              }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent" />
      </div>

      {/* Identity */}
      <div className="relative -mt-14 flex flex-col gap-4 px-2 sm:-mt-16 sm:flex-row sm:items-end">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg sm:h-28 sm:w-28">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="text-2xl">
            {initials(user.name ?? user.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name ?? user.username}</h1>
            {user.role !== "USER" && (
              <Badge className={ROLE_BADGE[user.role]}>
                {ROLE_LABEL[user.role]}
              </Badge>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tierClass(user.tier)}`}
            >
              {user.tier}
            </span>
            {online ? (
              <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                <Circle className="h-2 w-2 fill-current" /> online
              </span>
            ) : (
              user.lastSeenAt && (
                <span className="text-xs text-muted-foreground">
                  aktif {timeAgo(user.lastSeenAt)}
                </span>
              )
            )}
            {user.bannedAt && <Badge variant="destructive">Diblokir</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>

        {isMe ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Pencil /> Edit profil
            </Link>
          </Button>
        ) : (
          <FollowButton
            username={user.username}
            initialFollowing={!!iFollow}
            loggedIn={!!me}
          />
        )}
      </div>

      {/* Follow counts */}
      <div className="mt-3 flex gap-4 px-2 text-sm">
        <Link href={`/u/${user.username}/followers`} className="hover:underline">
          <span className="font-bold">{followerCount}</span>{" "}
          <span className="text-muted-foreground">pengikut</span>
        </Link>
        <Link href={`/u/${user.username}/following`} className="hover:underline">
          <span className="font-bold">{followingCount}</span>{" "}
          <span className="text-muted-foreground">mengikuti</span>
        </Link>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> Bergabung{" "}
          {fullDate(user.createdAt)}
        </span>
        <span>Peringkat #{rank}</span>
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <Globe className="h-3.5 w-3.5" />
            {user.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <Markdown className="prose-sm">{user.bio}</Markdown>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Poin", user.points],
          ["Thread", user._count.threads],
          ["Balasan", user._count.posts],
          ["Reaksi diterima", reactionsReceived],
        ].map(([label, val]) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <div className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Award className="h-5 w-5 text-primary" />
          Achievement
          <span className="text-sm font-normal text-muted-foreground">
            {earnedKeys.size}/{ACHIEVEMENTS.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACHIEVEMENTS.map((def) => {
            const earned = earnedKeys.has(def.key);
            return (
              <div
                key={def.key}
                title={def.description}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                  earned ? "bg-card" : "opacity-40 grayscale"
                }`}
              >
                <span className="text-2xl">{def.emoji}</span>
                <span className="text-xs font-medium">{def.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Aktivitas</h2>
        <ActivityHeatmap cells={heat} />
      </div>

      {/* Activity tabs */}
      <Tabs defaultValue="threads" className="mt-6">
        <TabsList>
          <TabsTrigger value="threads">Thread ({user._count.threads})</TabsTrigger>
          <TabsTrigger value="posts">Balasan</TabsTrigger>
          <TabsTrigger value="status">Status ({statuses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="threads">
          <Card className="divide-y">
            {user.threads.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Belum ada thread.</p>
            )}
            {user.threads.map((t) => (
              <Link
                key={t.id}
                href={`/forum/${t.category.slug}/${t.slug}`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category.name} · {timeAgo(t.createdAt)}
                  </p>
                </div>
                <Badge variant="secondary">{t._count.posts} pos</Badge>
              </Link>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="divide-y">
            {user.posts.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Belum ada balasan.</p>
            )}
            {user.posts.map((p) => (
              <Link
                key={p.id}
                href={`/forum/${p.thread.category.slug}/${p.thread.slug}#post-${p.id}`}
                className="block p-3 hover:bg-accent/50"
              >
                <p className="text-xs text-muted-foreground">
                  di <span className="text-foreground">{p.thread.title}</span> ·{" "}
                  {timeAgo(p.createdAt)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm">
                  {p.body.replace(/[#*`>_[\]!]/g, "").slice(0, 180)}
                </p>
              </Link>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-3">
          {statuses.length === 0 && (
            <Card>
              <p className="p-4 text-sm text-muted-foreground">Belum ada status.</p>
            </Card>
          )}
          {statuses.map((s) => (
            <StatusCard
              key={s.id}
              status={s}
              currentUsername={me?.username ?? null}
              canModerate={hasRole(me, "MODERATOR")}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
