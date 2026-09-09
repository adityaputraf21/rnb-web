import { prisma } from "@/lib/prisma";

export async function groupMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function listMyGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { username: true, name: true } } },
          },
        },
      },
    },
  });

  const rows = memberships
    .map((m) => {
      const g = m.group;
      const last = g.messages[0];
      const unread =
        last && (!m.lastReadAt || last.createdAt > m.lastReadAt) ? 1 : 0;
      return {
        id: g.id,
        name: g.name,
        image: g.image,
        memberCount: g._count.members,
        lastMessage: last
          ? last.deletedAt
            ? "pesan dihapus"
            : last.mediaUrl && !last.body
              ? "📎 Lampiran"
              : last.body.slice(0, 80)
          : "",
        lastSender: last?.sender?.name ?? last?.sender?.username ?? null,
        lastAt: (last?.createdAt ?? g.lastMessageAt).toISOString(),
        unread,
      };
    })
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

  return rows;
}

export async function unreadGroupCount(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true, lastReadAt: true },
  });
  let n = 0;
  for (const m of memberships) {
    const has = await prisma.groupMessage.count({
      where: {
        groupId: m.groupId,
        senderId: { not: userId },
        ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
      },
    });
    if (has) n += 1;
  }
  return n;
}
