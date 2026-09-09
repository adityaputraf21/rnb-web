import { NextResponse } from "next/server";
import { apiUser, apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { groupMembership } from "@/lib/group";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const me = await groupMembership(id, user.id);
  if (!me)
    return NextResponse.json({ error: "bukan anggota" }, { status: 403 });

  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  const rows = await prisma.groupMessage.findMany({
    where: { groupId: id },
    orderBy: { createdAt: "desc" },
    take: 40,
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    include: {
      sender: { select: { username: true, name: true, image: true } },
    },
  });

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId: id, userId: user.id } },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    messages: rows.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      createdAt: m.createdAt.toISOString(),
      mine: m.senderId === user.id,
      edited: !!m.editedAt,
      deleted: !!m.deletedAt,
      sender: {
        username: m.sender?.username ?? "?",
        name: m.sender?.name ?? null,
        image: m.sender?.image ?? null,
      },
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const me = await groupMembership(id, user.id);
  if (!me)
    return NextResponse.json({ error: "bukan anggota" }, { status: 403 });

  const { body, mediaUrl, mediaType } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim().slice(0, 4000) : "";
  const hasMedia = typeof mediaUrl === "string" && /^https:\/\//.test(mediaUrl);
  if (!text && !hasMedia)
    return NextResponse.json({ error: "pesan kosong" }, { status: 400 });

  const msg = await prisma.groupMessage.create({
    data: {
      groupId: id,
      senderId: user.id,
      body: text,
      mediaUrl: hasMedia ? mediaUrl : null,
      mediaType: hasMedia ? (mediaType ?? "file") : null,
    },
  });
  const group = await prisma.groupChat.update({
    where: { id },
    data: { lastMessageAt: new Date() },
    include: { members: { select: { userId: true } } },
  });

  const label = `${user.name ?? user.username} di ${group.name}`;
  await Promise.all(
    group.members
      .filter((m) => m.userId !== user.id)
      .map((m) =>
        notify({
          userId: m.userId,
          actorId: user.id,
          type: "DM",
          title: label,
          body: text.slice(0, 100) || "📎 Lampiran",
          url: `/groups/${id}`,
        }),
      ),
  );

  return NextResponse.json({
    id: msg.id,
    body: msg.body,
    mediaUrl: msg.mediaUrl,
    mediaType: msg.mediaType,
    createdAt: msg.createdAt.toISOString(),
    mine: true,
    edited: false,
    deleted: false,
    sender: {
      username: user.username,
      name: user.name ?? null,
      image: null,
    },
  });
}
