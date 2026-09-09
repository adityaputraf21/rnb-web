// Data achievement murni — aman diimpor dari client & server.

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
  { key: "first-status", name: "Say Hi", description: "Posting status pertama di feed", emoji: "📸" },
  { key: "status-25", name: "Aktif Feed", description: "25 status", emoji: "🗞️" },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.key, a]),
);
