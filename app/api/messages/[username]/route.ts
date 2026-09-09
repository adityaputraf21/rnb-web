import { NextResponse } from "next/server";
import { apiWriter, apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrCreateConversation, canDM, convPair } from "@/lib/dm";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

async function resolveOther(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, name: true, image: true },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { username } = await params;
  const other = await resolveOther(username);
  if (!other) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [aId, bId] = convPair(me.id, other.id);
  const conv = await prisma.conversation.findUnique({
    where: { aId_bId: { aId, bId } },
  });
  const clearedAt = conv
    ? me.id === conv.aId
      ? conv.aClearedAt
      : conv.bClearedAt
    : null;
  const muted = conv
    ? me.id === conv.aId
      ? conv.aMuted
      : conv.bMuted
    : false;

  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  const messages = conv
    ? await prisma.message.findMany({
        where: {
          conversationId: conv.id,
          ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 40,
        ...(before ? { cursor: { id: before }, skip: 1 } : {}),
        include: { reactions: { select: { emoji: true, userId: true } } },
      })
    : [];

  // tandai pesan dari lawan sebagai terbaca
  if (conv) {
    await prisma.message.updateMany({
      where: { conversationId: conv.id, senderId: other.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({
    other,
    muted,
    canMessage: await canDM(me.id, other.id),
    messages: messages.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      createdAt: m.createdAt.toISOString(),
      mine: m.senderId === me.id,
      read: !!m.readAt,
      edited: !!m.editedAt,
      deleted: !!m.deletedAt,
      reactions: m.reactions.map((r) => ({
        emoji: r.emoji,
        mine: r.userId === me.id,
      })),
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  let me;
  try {
    me = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { username } = await params;
  const other = await resolveOther(username);
  if (!other) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!(await canDM(me.id, other.id)))
    return NextResponse.json(
      { error: "Tidak bisa mengirim pesan ke pengguna ini" },
      { status: 403 },
    );

  const { body, mediaUrl, mediaType } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim().slice(0, 4000) : "";
  const hasMedia = typeof mediaUrl === "string" && /^https:\/\//.test(mediaUrl);
  if (!text && !hasMedia)
    return NextResponse.json({ error: "pesan kosong" }, { status: 400 });

  const conv = await getOrCreateConversation(me.id, other.id);
  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: me.id,
      body: text,
      mediaUrl: hasMedia ? mediaUrl : null,
      mediaType: hasMedia ? (mediaType ?? "file") : null,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date() },
  });

  const otherMuted = other.id === conv.aId ? conv.aMuted : conv.bMuted;
  if (!otherMuted)
    await notify({
    userId: other.id,
    actorId: me.id,
    type: "DM",
    title: `Pesan baru dari ${me.name ?? me.username}`,
    body: text.slice(0, 100) || "📎 Lampiran",
    url: `/messages/${me.username}`,
  });

  return NextResponse.json({
    id: msg.id,
    body: msg.body,
    mediaUrl: msg.mediaUrl,
    mediaType: msg.mediaType,
    createdAt: msg.createdAt.toISOString(),
    mine: true,
    read: false,
    edited: false,
    deleted: false,
    reactions: [],
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { username } = await params;
  const other = await resolveOther(username);
  if (!other) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [aId, bId] = convPair(me.id, other.id);
  const conv = await prisma.conversation.findUnique({
    where: { aId_bId: { aId, bId } },
  });
  if (!conv) return NextResponse.json({ error: "belum ada percakapan" }, { status: 404 });

  const isA = me.id === conv.aId;
  const { action } = await req.json().catch(() => ({}));

  if (action === "clear") {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: isA ? { aClearedAt: new Date() } : { bClearedAt: new Date() },
    });
  } else if (action === "mute" || action === "unmute") {
    const val = action === "mute";
    await prisma.conversation.update({
      where: { id: conv.id },
      data: isA ? { aMuted: val } : { bMuted: val },
    });
  } else {
    return NextResponse.json({ error: "action tidak valid" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
