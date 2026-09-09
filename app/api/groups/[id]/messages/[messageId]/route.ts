import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { groupMembership } from "@/lib/group";

export const runtime = "nodejs";

type GroupMessageRow = NonNullable<
  Awaited<ReturnType<typeof prisma.groupMessage.findUnique>>
>;

async function loadOwn(
  groupId: string,
  messageId: string,
  userId: string,
): Promise<{ msg?: GroupMessageRow; err?: NextResponse }> {
  const me = await groupMembership(groupId, userId);
  if (!me)
    return { err: NextResponse.json({ error: "bukan anggota" }, { status: 403 }) };
  const msg = await prisma.groupMessage.findUnique({ where: { id: messageId } });
  if (!msg || msg.groupId !== groupId || msg.deletedAt)
    return { err: NextResponse.json({ error: "not found" }, { status: 404 }) };
  if (msg.senderId !== userId)
    return {
      err: NextResponse.json({ error: "bukan pesanmu" }, { status: 403 }),
    };
  return { msg };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id, messageId } = await params;
  const { msg, err } = await loadOwn(id, messageId, user.id);
  if (err || !msg) return err ?? NextResponse.json({ error: "not found" }, { status: 404 });

  const { body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim().slice(0, 4000) : "";
  if (!text)
    return NextResponse.json({ error: "kosong" }, { status: 400 });

  await prisma.groupMessage.update({
    where: { id: msg.id },
    data: { body: text, editedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id, messageId } = await params;
  const { msg, err } = await loadOwn(id, messageId, user.id);
  if (err || !msg) return err ?? NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.groupMessage.update({
    where: { id: msg.id },
    data: { deletedAt: new Date(), body: "", mediaUrl: null, mediaType: null },
  });
  return NextResponse.json({ ok: true });
}
