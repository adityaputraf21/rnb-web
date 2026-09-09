import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, leaderboardTierEmbed } from "@/lib/discord";
import { tierForPoints } from "@/lib/tiers";

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.leaderboardEntry.findMany({
    orderBy: { points: "desc" },
    take: 100,
  });
  return NextResponse.json(rows);
}

/**
 * Tambah poin ke user. Kalau poin baru bikin dia pindah tier -> notif Discord.
 * body: { username: string, delta: number }
 */
export async function POST(req: Request) {
  const { username, delta } = await req.json().catch(() => ({}));

  if (!username || typeof delta !== "number") {
    return NextResponse.json(
      { error: "username (string) & delta (number) wajib diisi" },
      { status: 400 },
    );
  }

  const before = await prisma.leaderboardEntry.findUnique({
    where: { username },
  });
  const oldPoints = before?.points ?? 0;
  const oldTier = before?.tier ?? tierForPoints(oldPoints);

  const newPoints = Math.max(0, oldPoints + delta);
  const newTier = tierForPoints(newPoints);

  const entry = await prisma.leaderboardEntry.upsert({
    where: { username },
    create: { username, points: newPoints, tier: newTier },
    update: { points: newPoints, tier: newTier },
  });

  // Hitung ulang rank (posisi berdasarkan poin).
  const higher = await prisma.leaderboardEntry.count({
    where: { points: { gt: newPoints } },
  });
  const rank = higher + 1;
  await prisma.leaderboardEntry.update({
    where: { username },
    data: { rank },
  });

  // Notifikasi hanya saat NAIK tier.
  const tierChangedUp =
    newTier !== oldTier && newPoints > oldPoints;
  if (tierChangedUp) {
    await sendDiscordWebhook({
      category: "leaderboard",
      embed: leaderboardTierEmbed({
        username,
        fromTier: oldTier,
        toTier: newTier,
        rank,
      }),
    });
  }

  return NextResponse.json({ ...entry, rank, tierChangedUp });
}
