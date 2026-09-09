import Link from "next/link";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { initials, cn } from "@/lib/utils";
import { tierClass } from "@/lib/tier-style";

export const metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const me = await getCurrentUser();
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

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Poin dari aktivitas: bikin thread (+10), balas (+4), dapat reaksi (+2).
      </p>

      <Card className="divide-y">
        {users.map((u, i) => (
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
              <p className="text-xs text-muted-foreground">
                {u._count.threads} thread · {u._count.posts} post
              </p>
            </div>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] ${tierClass(u.tier)}`}
            >
              {u.tier}
            </span>
            <span className="w-14 text-right font-semibold tabular-nums">
              {u.points}
            </span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
