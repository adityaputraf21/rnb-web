import { NextResponse } from "next/server";
import { apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrCreateConversation, canDM } from "@/lib/dm";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

/** Balas story -> jadi pesan DM ke pemilik story. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    include: { author: { select: { id: true, username: true } } },
  });
  if (!story?.author)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (story.author.id === me.id)
    return NextResponse.json({ error: "story sendiri" }, { status: 400 });
  if (!(await canDM(me.id, story.author.id)))
    return NextResponse.json({ error: "tidak bisa kirim pesan" }, { status: 403 });

  const { body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim().slice(0, 1000) : "";
  if (!text) return NextResponse.json({ error: "kosong" }, { status: 400 });

  const conv = await getOrCreateConversation(me.id, story.author.id);
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: me.id,
      body: `↩️ Membalas story: ${text}`,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date() },
  });

  await notify({
    userId: story.author.id,
    actorId: me.id,
    type: "DM",
    title: `${me.name ?? me.username} membalas story kamu`,
    body: text.slice(0, 100),
    url: `/messages/${me.username}`,
  });

  return NextResponse.json({ ok: true });
}
