import { prisma } from "@/lib/prisma";

export type QuestMetric =
  | "status"
  | "post"
  | "thread"
  | "reactionGiven"
  | "commentGiven"
  | "storyPosted"
  | "followersGained"
  | "loginStreak";

export type QuestDef = {
  key: string;
  title: string;
  description: string;
  metric: QuestMetric;
  target: number;
  reward: number;
  period: "weekly" | "seasonal";
};

export const QUESTS: QuestDef[] = [
  {
    key: "weekly_status_5",
    title: "Aktif di feed",
    description: "Posting 5 status minggu ini",
    metric: "status",
    target: 5,
    reward: 30,
    period: "weekly",
  },
  {
    key: "weekly_reply_10",
    title: "Tukang balas",
    description: "Balas 10 thread forum minggu ini",
    metric: "post",
    target: 10,
    reward: 40,
    period: "weekly",
  },
  {
    key: "weekly_thread_1",
    title: "Mulai obrolan",
    description: "Buat 1 thread baru minggu ini",
    metric: "thread",
    target: 1,
    reward: 20,
    period: "weekly",
  },
  {
    key: "weekly_react_15",
    title: "Apresiasi",
    description: "Beri 15 reaksi minggu ini",
    metric: "reactionGiven",
    target: 15,
    reward: 15,
    period: "weekly",
  },
  {
    key: "weekly_story_3",
    title: "Bagikan momen",
    description: "Unggah 3 story minggu ini",
    metric: "storyPosted",
    target: 3,
    reward: 15,
    period: "weekly",
  },
  {
    key: "weekly_streak_5",
    title: "Rajin mampir",
    description: "Login 5 hari beruntun",
    metric: "loginStreak",
    target: 5,
    reward: 25,
    period: "weekly",
  },
  {
    key: "season_status_40",
    title: "Kreator musim ini",
    description: "Posting 40 status selama musim",
    metric: "status",
    target: 40,
    reward: 150,
    period: "seasonal",
  },
  {
    key: "season_reply_80",
    title: "Pilar komunitas",
    description: "Balas 80 thread selama musim",
    metric: "post",
    target: 80,
    reward: 200,
    period: "seasonal",
  },
  {
    key: "season_followers_10",
    title: "Makin dikenal",
    description: "Dapat 10 pengikut baru musim ini",
    metric: "followersGained",
    target: 10,
    reward: 120,
    period: "seasonal",
  },
];

/* ------------------------------------------------------------------ */
/*  Periode                                                            */
/* ------------------------------------------------------------------ */

const SEASON_EPOCH = Date.UTC(2026, 0, 5); // Senin 2026-01-05
const SEASON_MS = 91 * 86400000; // ~13 minggu

function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: date.getUTCFullYear(), week };
}

function weekStart(d: Date): Date {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}

export function periodKey(period: "weekly" | "seasonal", now = new Date()) {
  if (period === "weekly") {
    const { year, week } = isoWeek(now);
    return `${year}-W${String(week).padStart(2, "0")}`;
  }
  const idx = Math.floor((now.getTime() - SEASON_EPOCH) / SEASON_MS);
  return `S${idx}`;
}

export function periodWindow(period: "weekly" | "seasonal", now = new Date()) {
  if (period === "weekly") {
    const start = weekStart(now);
    return { start, end: new Date(start.getTime() + 7 * 86400000) };
  }
  const idx = Math.floor((now.getTime() - SEASON_EPOCH) / SEASON_MS);
  const start = new Date(SEASON_EPOCH + idx * SEASON_MS);
  return { start, end: new Date(start.getTime() + SEASON_MS) };
}

export function seasonNumber(now = new Date()) {
  return Math.floor((now.getTime() - SEASON_EPOCH) / SEASON_MS) + 1;
}

/* ------------------------------------------------------------------ */
/*  Progress (dihitung on-demand dari data asli)                       */
/* ------------------------------------------------------------------ */

async function metricCount(
  metric: QuestMetric,
  userId: string,
  since: Date,
  streak: number,
): Promise<number> {
  switch (metric) {
    case "status":
      return prisma.status.count({
        where: { authorId: userId, deletedAt: null, createdAt: { gte: since } },
      });
    case "post":
      return prisma.post.count({
        where: { authorId: userId, deletedAt: null, createdAt: { gte: since } },
      });
    case "thread":
      return prisma.thread.count({
        where: { authorId: userId, deletedAt: null, createdAt: { gte: since } },
      });
    case "reactionGiven": {
      const [a, b] = await Promise.all([
        prisma.reaction.count({
          where: { userId, createdAt: { gte: since } },
        }),
        prisma.statusReaction.count({
          where: { userId, createdAt: { gte: since } },
        }),
      ]);
      return a + b;
    }
    case "commentGiven":
      return prisma.statusComment.count({
        where: { authorId: userId, deletedAt: null, createdAt: { gte: since } },
      });
    case "storyPosted":
      return prisma.story.count({
        where: { authorId: userId, createdAt: { gte: since } },
      });
    case "followersGained":
      return prisma.follow.count({
        where: { followingId: userId, createdAt: { gte: since } },
      });
    case "loginStreak":
      return streak;
    default:
      return 0;
  }
}

export type QuestProgress = QuestDef & {
  count: number;
  done: boolean;
  claimed: boolean;
  period_key: string;
};

export async function questProgress(
  userId: string,
): Promise<{ weekly: QuestProgress[]; seasonal: QuestProgress[]; season: number }> {
  const now = new Date();
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true },
  });
  const streak = me?.streakCount ?? 0;

  const keys = QUESTS.map((q) => `${q.key}:${periodKey(q.period, now)}`);
  const claims = await prisma.questClaim.findMany({
    where: {
      userId,
      OR: QUESTS.map((q) => ({
        questKey: q.key,
        periodKey: periodKey(q.period, now),
      })),
    },
    select: { questKey: true, periodKey: true },
  });
  const claimedSet = new Set(claims.map((c) => `${c.questKey}:${c.periodKey}`));

  const rows = await Promise.all(
    QUESTS.map(async (q, i) => {
      const win = periodWindow(q.period, now);
      const count = await metricCount(q.metric, userId, win.start, streak);
      const pk = periodKey(q.period, now);
      return {
        ...q,
        count,
        done: count >= q.target,
        claimed: claimedSet.has(keys[i]),
        period_key: pk,
      } satisfies QuestProgress;
    }),
  );

  return {
    weekly: rows.filter((r) => r.period === "weekly"),
    seasonal: rows.filter((r) => r.period === "seasonal"),
    season: seasonNumber(now),
  };
}
