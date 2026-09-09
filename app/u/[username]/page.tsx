import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { initials } from "@/lib/utils";
import { timeAgo, fullDate } from "@/lib/format";
import { tierClass, ROLE_LABEL } from "@/lib/tier-style";

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

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="text-xl">
            {initials(user.name ?? user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name ?? user.username}</h1>
            {user.role !== "USER" && <Badge>{ROLE_LABEL[user.role]}</Badge>}
            {user.bannedAt && <Badge variant="destructive">Diblokir</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded border px-2 py-0.5 text-xs ${tierClass(user.tier)}`}
            >
              {user.tier}
            </span>
            <span className="text-muted-foreground">
              {user.points} poin · peringkat #{rank}
            </span>
          </div>
          {user.bio && (
            <div className="mt-3">
              <Markdown className="prose-sm">{user.bio}</Markdown>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Bergabung {fullDate(user.createdAt)}
          </p>
        </div>
      </div>

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
