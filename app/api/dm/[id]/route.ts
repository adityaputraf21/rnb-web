import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
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
  const msg = await prisma.message.findUnique({ where: { id } });
  if (!msg || msg.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (msg.senderId !== me.id)
    return NextResponse.json({ error: "bukan pesan kamu" }, { status: 403 });

  const { body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || body.trim().length < 1)
    return NextResponse.json({ error: "isi kosong" }, { status: 400 });

  const updated = await prisma.message.update({
    where: { id },
    data: { body: body.trim().slice(0, 4000), editedAt: new Date() },
  });
  return NextResponse.json({ id: updated.id, body: updated.body });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const msg = await prisma.message.findUnique({ where: { id } });
  if (!msg || msg.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (msg.senderId !== me.id && me.role === "USER")
    return NextResponse.json({ error: "tidak diizinkan" }, { status: 403 });

  await prisma.message.update({
    where: { id },
    data: { deletedAt: new Date(), body: "", mediaUrl: null, mediaType: null },
  });
  return NextResponse.json({ ok: true });
}
