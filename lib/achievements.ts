import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "@/lib/achievements-data";

export { ACHIEVEMENTS, ACHIEVEMENT_MAP };
export type { AchievementDef } from "@/lib/achievements-data";

async function grant(userId: string, key: string) {
  const def = ACHIEVEMENT_MAP[key];
  if (!def) return;
  try {
    await prisma.userAchievement.create({ data: { userId, key } });
  } catch {
    return; // sudah punya (unique constraint)
  }
  await notify({
    userId,
    type: "ACHIEVEMENT",
    title: `${def.emoji} Achievement: ${def.name}`,
    body: def.description,
    url: `/u/me`,
  });
}

/**
 * Evaluasi & beri achievement yang layak untuk seorang user.
 * Dipanggil setelah aksi (buat thread, post, dapat reaksi, naik tier).
 */
export async function checkAchievements(userId: string) {
  const [threads, posts, reactions, statuses, user] = await Promise.all([
    prisma.thread.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.post.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.reaction.count({ where: { post: { authorId: userId } } }),
    prisma.status.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.user.findUnique({ where: { id: userId }, select: { tier: true } }),
  ]);

  const earn: string[] = [];
  if (threads >= 1) earn.push("first-thread");
  if (posts >= 1) earn.push("first-post");
  if (posts >= 50) earn.push("posts-50");
  if (posts >= 250) earn.push("posts-250");
  if (reactions >= 25) earn.push("reactions-25");
  if (reactions >= 100) earn.push("reactions-100");
  if (statuses >= 1) earn.push("first-status");
  if (statuses >= 25) earn.push("status-25");
  if (user?.tier && ["Gold", "Platinum", "Diamond", "Legend"].includes(user.tier))
    earn.push("tier-gold");
  if (user?.tier === "Legend") earn.push("tier-legend");

  for (const key of earn) await grant(userId, key);
}
