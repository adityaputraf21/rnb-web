import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { initials } from "@/lib/utils";
import { timeAgo, fullDate } from "@/lib/format";
import { tierClass, ROLE_LABEL, ROLE_BADGE } from "@/lib/tier-style";
import { ACHIEVEMENT_MAP } from "@/lib/achievements";

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
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      _count: { select: { threads: true, posts: true } },
      achievements: { orderBy: { earnedAt: "desc" } },
      threads: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { category: true },
      },
    },
  });
  if (!user) notFound();

  const rank =
    (await prisma.user.count({ where: { points: { gt: user.points } } })) + 1;
  const online =
    !!user.lastSeenAt && Date.now() - user.lastSeenAt.getTime() < 5 * 60000;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div
        className="h-24 rounded-xl"
        style={{
          background: user.bannerColor
            ? `linear-gradient(135deg, ${user.bannerColor}, ${user.bannerColor}99)`
            : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))",
        }}
      />
      <div className="-mt-12 flex items-end gap-4 px-1">
        <Avatar className="h-20 w-20 border-4 border-background">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="text-xl">
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
            {online && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Circle className="h-2 w-2 fill-current" /> online
              </span>
            )}
            {user.bannedAt && <Badge variant="destructive">Diblokir</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1 text-sm">
        <span className={`rounded border px-2 py-0.5 text-xs ${tierClass(user.tier)}`}>
          {user.tier}
        </span>
        <span className="text-muted-foreground">
          {user.points} poin · peringkat #{rank}
        </span>
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
        {!online && user.lastSeenAt && (
          <span className="text-xs text-muted-foreground">
            terakhir dilihat {timeAgo(user.lastSeenAt)}
          </span>
        )}
      </div>

      {user.bio && (
        <div className="px-1">
          <Markdown className="prose-sm">{user.bio}</Markdown>
        </div>
      )}
      <p className="px-1 text-xs text-muted-foreground">
        Bergabung {fullDate(user.createdAt)}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Thread", user._count.threads],
          ["Post", user._count.posts],
          ["Poin", user.points],
        ].map(([label, val]) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {user.achievements.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Achievement</h2>
          <div className="flex flex-wrap gap-2">
            {user.achievements.map((a) => {
              const def = ACHIEVEMENT_MAP[a.key];
              if (!def) return null;
              return (
                <div
                  key={a.id}
                  title={`${def.description} · ${fullDate(a.earnedAt)}`}
                  className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-sm"
                >
                  <span>{def.emoji}</span>
                  <span>{def.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold">Thread terbaru</h2>
        <Card className="divide-y">
          {user.threads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada thread.</p>
          )}
          {user.threads.map((t) => (
            <Link
              key={t.id}
              href={`/forum/${t.category.slug}/${t.slug}`}
              className="block p-3 hover:bg-accent/50"
            >
              <p className="font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.category.name} · {timeAgo(t.createdAt)}
              </p>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}
