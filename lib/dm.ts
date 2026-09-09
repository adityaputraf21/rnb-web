import { prisma } from "@/lib/prisma";

/** Urutkan dua id supaya (aId, bId) selalu konsisten. */
export function convPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

export async function getOrCreateConversation(u1: string, u2: string) {
  const [aId, bId] = convPair(u1, u2);
  return prisma.conversation.upsert({
    where: { aId_bId: { aId, bId } },
    update: {},
    create: { aId, bId },
  });
}

/** Boleh DM? (tidak saling blokir) */
export async function canDM(u1: string, u2: string) {
  if (u1 === u2) return false;
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: u1, blockedId: u2 },
        { blockerId: u2, blockedId: u1 },
      ],
    },
    select: { id: true },
  });
  return !block;
}

export async function unreadDMCount(userId: string) {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ aId: userId }, { bId: userId }] },
    },
  });
}
