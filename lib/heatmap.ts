import { prisma } from "@/lib/prisma";

export type HeatCell = { date: string; count: number };

/** Aktivitas 26 minggu terakhir (thread + post + status), per hari. */
export async function activityHeatmap(userId: string): Promise<HeatCell[]> {
  const since = new Date(Date.now() - 26 * 7 * 86400000);
  const [threads, posts, statuses] = await Promise.all([
    prisma.thread.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.post.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.status.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const map = new Map<string, number>();
  for (const d of [...threads, ...posts, ...statuses]) {
    const key = d.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const cells: HeatCell[] = [];
  const start = new Date(since);
  start.setDate(start.getDate() - start.getDay()); // mulai Minggu
  for (let i = 0; i < 26 * 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: map.get(key) ?? 0 });
  }
  return cells;
}
