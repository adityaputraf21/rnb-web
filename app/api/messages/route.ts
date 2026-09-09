import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const convs = await prisma.conversation.findMany({
    where: { OR: [{ aId: me.id }, { bId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      a: { select: { username: true, name: true, image: true } },
      b: { select: { username: true, name: true, image: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const items = await Promise.all(
    convs.map(async (c) => {
      const other = c.aId === me.id ? c.b : c.a;
      const otherId = c.aId === me.id ? c.bId : c.aId;
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          readAt: null,
          senderId: otherId,
        },
      });
      const last = c.messages[0];
      return {
        username: other.username,
        name: other.name,
        image: other.image,
        lastMessage: last
          ? last.mediaUrl && !last.body
            ? "📎 Lampiran"
            : last.body.slice(0, 80)
          : "",
        lastAt: (last?.createdAt ?? c.lastMessageAt).toISOString(),
        unread,
        mine: last?.senderId === me.id,
      };
    }),
  );

  return NextResponse.json(items);
}
