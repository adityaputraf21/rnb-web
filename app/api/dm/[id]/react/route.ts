import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED = ["👍", "❤️", "😂", "🔥", "😮", "😢", "🙏"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const { emoji } = await req.json().catch(() => ({}));
  if (!ALLOWED.includes(emoji))
    return NextResponse.json({ error: "emoji tidak valid" }, { status: 400 });

  const msg = await prisma.message.findUnique({
    where: { id },
    include: { conversation: { select: { aId: true, bId: true } } },
  });
  if (!msg || msg.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (msg.conversation.aId !== me.id && msg.conversation.bId !== me.id)
    return NextResponse.json({ error: "bukan chat kamu" }, { status: 403 });

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId: id, userId: me.id, emoji } },
  });
  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.deleteMany({
      where: { messageId: id, userId: me.id },
    });
    await prisma.messageReaction.create({
      data: { messageId: id, userId: me.id, emoji },
    });
  }

  const all = await prisma.messageReaction.findMany({ where: { messageId: id } });
  return NextResponse.json({
    reactions: all.map((r) => ({ emoji: r.emoji, mine: r.userId === me.id })),
  });
}
