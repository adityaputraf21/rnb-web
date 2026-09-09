import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notifications";
import { periodWindow, seasonNumber } from "@/lib/quests";
import { sendDiscordWebhook } from "@/lib/discord";

const REWARDS = [300, 200, 100, 60, 60, 40, 40, 40, 40, 40];

/** Idempoten: no-op kalau musim sebelumnya sudah diberi hadiah. */
export async function seasonRollover() {
  const now = new Date();
  const prevSeason = seasonNumber(now) - 1;
  if (prevSeason < 1) return { skipped: "belum ada musim sebelumnya" };

  const existing = await prisma.seasonAward.findFirst({
    where: { season: prevSeason },
    select: { id: true },
  });
  if (existing) return { skipped: `musim ${prevSeason} sudah selesai` };

  const win = periodWindow("seasonal", now);
  const span = win.end.getTime() - win.start.getTime();
  const prevStart = new Date(win.start.getTime() - span);
  const prevEnd = win.start;

  const users = await prisma.user.findMany({
    where: { bannedAt: null },
    select: {
      id: true,
      username: true,
      name: true,
      _count: {
        select: {
          threads: {
            where: { createdAt: { gte: prevStart, lt: prevEnd }, deletedAt: null },
          },
          posts: {
            where: { createdAt: { gte: prevStart, lt: prevEnd }, deletedAt: null },
          },
          statuses: {
            where: { createdAt: { gte: prevStart, lt: prevEnd }, deletedAt: null },
          },
        },
      },
    },
  });

  const scored = users
    .map((u) => ({
      ...u,
      score: u._count.threads * 10 + u._count.posts * 4 + u._count.statuses * 3,
    }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (scored.length === 0)
    return { skipped: `tidak ada aktivitas musim ${prevSeason}` };

  for (let i = 0; i < scored.length; i++) {
    const u = scored[i];
    const reward = REWARDS[i] ?? 40;
    await prisma.seasonAward.create({
      data: { userId: u.id, season: prevSeason, rank: i + 1, points: reward },
    });
    await awardPoints(u.id, reward).catch(() => {});
    await notify({
      userId: u.id,
      type: "ACHIEVEMENT",
      title: `Peringkat #${i + 1} Musim ${prevSeason}! 🏆`,
      body: `+${reward} poin bonus`,
      url: "/quests",
    }).catch(() => {});
  }

  await sendDiscordWebhook({
    category: "leaderboard",
    embed: {
      author: { name: `🏆 Hasil Musim ${prevSeason}` },
      description: scored
        .slice(0, 5)
        .map((u, i) => `**#${i + 1}** ${u.name ?? u.username} — ${u.score} poin`)
        .join("\n"),
    },
  }).catch(() => {});

  return { season: prevSeason, awarded: scored.length };
}
