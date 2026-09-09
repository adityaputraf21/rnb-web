import { prisma } from "@/lib/prisma";
import { tierForPoints } from "@/lib/tiers";
import { sendDiscordWebhook, leaderboardTierEmbed } from "@/lib/discord";

export const POINTS = {
  THREAD: 10,
  POST: 4,
  REACTION_RECEIVED: 2,
} as const;

/**
 * Tambah/kurangi poin user, recalc tier, dan kirim notif Discord kalau NAIK tier.
 * Aman dipanggil dari route handler; kegagalan webhook tidak melempar error.
 */
export async function awardPoints(userId: string, delta: number) {
  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, tier: true, username: true },
  });
  if (!before) return;

  const newPoints = Math.max(0, before.points + delta);
  const newTier = tierForPoints(newPoints);

  await prisma.user.update({
    where: { id: userId },
    data: { points: newPoints, tier: newTier },
  });

  if (newTier !== before.tier && newPoints > before.points) {
    const higher = await prisma.user.count({
      where: { points: { gt: newPoints } },
    });
    await sendDiscordWebhook({
      category: "leaderboard",
      embed: leaderboardTierEmbed({
        username: before.username,
        fromTier: before.tier,
        toTier: newTier,
        rank: higher + 1,
      }),
    });
  }
}
