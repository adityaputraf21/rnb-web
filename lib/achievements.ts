import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export type AchievementDef = {
  key: string;
  name: string;
  description: string;
  emoji: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-thread", name: "Pembuka Diskusi", description: "Membuat thread pertama", emoji: "📝" },
  { key: "first-post", name: "Ikut Bicara", description: "Menulis balasan pertama", emoji: "💬" },
  { key: "posts-50", name: "Kontributor", description: "50 balasan", emoji: "✍️" },
  { key: "posts-250", name: "Veteran", description: "250 balasan", emoji: "🎖️" },
  { key: "reactions-25", name: "Disukai", description: "Menerima 25 reaksi", emoji: "❤️" },
  { key: "reactions-100", name: "Idola", description: "Menerima 100 reaksi", emoji: "🌟" },
  { key: "tier-gold", name: "Naik Kelas", description: "Mencapai tier Gold", emoji: "🏅" },
  { key: "tier-legend", name: "Legenda", description: "Mencapai tier Legend", emoji: "👑" },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.key, a]),
);

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
  const [threads, posts, reactions, user] = await Promise.all([
    prisma.thread.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.post.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.reaction.count({ where: { post: { authorId: userId } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { tier: true } }),
  ]);

  const earn: string[] = [];
  if (threads >= 1) earn.push("first-thread");
  if (posts >= 1) earn.push("first-post");
  if (posts >= 50) earn.push("posts-50");
  if (posts >= 250) earn.push("posts-250");
  if (reactions >= 25) earn.push("reactions-25");
  if (reactions >= 100) earn.push("reactions-100");
  if (user?.tier && ["Gold", "Platinum", "Diamond", "Legend"].includes(user.tier))
    earn.push("tier-gold");
  if (user?.tier === "Legend") earn.push("tier-legend");

  for (const key of earn) await grant(userId, key);
}
