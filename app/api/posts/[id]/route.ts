import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function loadPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { thread: { include: { category: true } } },
  });
}

export async function PATCH(
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
  const post = await loadPost(id);
  if (!post || post.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId !== user.id) {
    return NextResponse.json({ error: "bukan post kamu" }, { status: 403 });
  }

  const { body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || body.trim().length < 2) {
    return NextResponse.json({ error: "isi kosong" }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { body: body.trim(), editedAt: new Date() },
  });
  return NextResponse.json({ id: updated.id, body: updated.body });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const post = await loadPost(id);
  if (!post || post.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = post.authorId === user.id;
  if (!isOwner && user.role === "USER") {
    return NextResponse.json({ error: "tidak diizinkan" }, { status: 403 });
  }

  await prisma.post.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  if (!isOwner) {
    await prisma.auditLog.create({
      data: {
        moderatorId: user.id,
        action: "post.delete",
        targetType: "post",
        targetId: id,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
