import { prisma } from "@/lib/prisma";
import { blockedIdsFor } from "@/lib/blocks";
import { mutedKeywordsFor, mutedStatusWhere } from "@/lib/mute";
import { shapeStatus, statusInclude } from "@/lib/status-shape";

/**
 * Feed "Untukmu": ambil status 4 hari terakhir, skor berdasarkan
 * kedekatan (follow / pernah interaksi), engagement, dan kebaruan.
 */
export async function forYouStatuses(
  me: { id: string; username: string },
  take = 30,
) {
  const userId = me.id;
  const since = new Date(Date.now() - 4 * 86400000);
  const [follows, myLikes, myComments, hidden, mutedKw] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    prisma.statusLike.findMany({
      where: { userId },
      select: { status: { select: { authorId: true } } },
      take: 300,
      orderBy: { createdAt: "desc" },
    }),
    prisma.statusComment.findMany({
      where: { authorId: userId },
      select: { status: { select: { authorId: true } } },
      take: 200,
      orderBy: { createdAt: "desc" },
    }),
    blockedIdsFor(userId),
    mutedKeywordsFor(userId),
  ]);

  const followed = new Set(follows.map((f) => f.followingId));
  const affinity = new Map<string, number>();
  for (const l of myLikes)
    if (l.status.authorId)
      affinity.set(l.status.authorId, (affinity.get(l.status.authorId) ?? 0) + 1);
  for (const c of myComments)
    if (c.status.authorId)
      affinity.set(
        c.status.authorId,
        (affinity.get(c.status.authorId) ?? 0) + 2,
      );

  const rows = await prisma.status.findMany({
    where: {
      deletedAt: null,
      publishAt: { lte: new Date() },
      createdAt: { gte: since },
      authorId: { not: userId, ...(hidden.size ? { notIn: [...hidden] } : {}) },
      ...mutedStatusWhere(mutedKw),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: statusInclude(userId),
  });

  const now = Date.now();
  const scored = rows
    .map((s) => {
      const ageH = (now - new Date(s.createdAt).getTime()) / 3600000;
      const recency = Math.max(0, 1 - ageH / 96) * 6;
      const follow = s.authorId && followed.has(s.authorId) ? 5 : 0;
      const aff = s.authorId ? Math.min(6, affinity.get(s.authorId) ?? 0) : 0;
      const eng =
        s._count.likes * 0.6 +
        s._count.comments * 1.0 +
        s._count.reposts * 1.5;
      return { s, score: recency + follow + aff + Math.min(10, eng) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  return scored.map((x) => shapeStatus(x.s, me));
}
