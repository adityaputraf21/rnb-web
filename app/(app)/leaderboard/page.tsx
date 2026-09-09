import Link from "next/link";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { initials, cn } from "@/lib/utils";
import { tierClass } from "@/lib/tier-style";

export const metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

type Row = {
  username: string;
  name: string | null;
  image: string | null;
  tier: string;
  score: number;
  detail: string;
};

const PERIODS = {
  all: "Semua waktu",
  week: "Minggu ini",
  month: "Bulan ini",
} as const;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const me = await getCurrentUser();
  const { p = "all" } = await searchParams;
  const period = (p in PERIODS ? p : "all") as keyof typeof PERIODS;

  let rows: Row[];

  if (period === "all") {
    const users = await prisma.user.findMany({
      where: { bannedAt: null },
      orderBy: [{ points: "desc" }, { createdAt: "asc" }],
      take: 100,
      select: {
        username: true,
        name: true,
        image: true,
        points: true,
        tier: true,
        _count: { select: { threads: true, posts: true } },
      },
    });
    rows = users.map((u) => ({
      username: u.username,
      name: u.name,
      image: u.image,
      tier: u.tier,
      score: u.points,
      detail: `${u._count.threads} thread · ${u._count.posts} post`,
    }));
  } else {
    const since = new Date(
      Date.now() - (period === "week" ? 7 : 30) * 86400000,
    );
    const users = await prisma.user.findMany({
      where: { bannedAt: null },
      select: {
        username: true,
        name: true,
        image: true,
        tier: true,
        _count: {
          select: {
            threads: { where: { createdAt: { gte: since }, deletedAt: null } },
            posts: { where: { createdAt: { gte: since }, deletedAt: null } },
            statuses: { where: { createdAt: { gte: since }, deletedAt: null } },
          },
        },
      },
    });
    rows = users
      .map((u) => {
        const score =
          u._count.threads * 10 + u._count.posts * 4 + u._count.statuses * 3;
        return {
          username: u.username,
          name: u.name,
          image: u.image,
          tier: u.tier,
          score,
          detail: `${u._count.threads}t · ${u._count.posts}b · ${u._count.statuses}s`,
        };
      })
      .filter((u) => u.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      <div className="flex gap-1">
        {Object.entries(PERIODS).map(([key, label]) => (
          <Button
            key={key}
            variant={period === key ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link href={`/leaderboard?p=${key}`}>{label}</Link>
          </Button>
        ))}
      </div>

      <Card className="divide-y">
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Belum ada aktivitas di periode ini.
          </p>
        )}
        {rows.map((u, i) => (
          <Link
            key={u.username}
            href={`/u/${u.username}`}
            className={cn(
              "flex items-center gap-3 p-3 hover:bg-accent/50",
              me?.username === u.username && "bg-primary/5",
            )}
          >
            <span
              className={cn(
                "w-6 text-center font-bold",
                i === 0 && "text-yellow-500",
                i === 1 && "text-zinc-400",
                i === 2 && "text-amber-600",
                i > 2 && "text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={u.image ?? undefined} />
              <AvatarFallback>{initials(u.name ?? u.username)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{u.name ?? u.username}</p>
              <p className="text-xs text-muted-foreground">{u.detail}</p>
            </div>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] ${tierClass(u.tier)}`}
            >
              {u.tier}
            </span>
            <span className="w-14 text-right font-semibold tabular-nums">
              {u.score}
            </span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
