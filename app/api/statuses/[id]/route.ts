import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { modLog } from "@/lib/mod-log";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const status = await prisma.status.findFirst({
    where: { id, deletedAt: null },
    include: {
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { username: true, name: true, image: true } },
        },
      },
    },
  });
  if (!status) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    comments: status.comments.map((c) => ({
      id: c.id,
      body: c.body,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
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
  const status = await prisma.status.findUnique({ where: { id } });
  if (!status || status.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (status.authorId !== user.id)
    return NextResponse.json({ error: "bukan status kamu" }, { status: 403 });

  const { body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || body.trim().length === 0)
    return NextResponse.json({ error: "isi kosong" }, { status: 400 });

  await prisma.status.update({
    where: { id },
    data: { body: body.trim().slice(0, 2000), editedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
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
  const status = await prisma.status.findUnique({ where: { id } });
  if (!status || status.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = status.authorId === user.id;
  if (!isOwner && user.role === "USER")
    return NextResponse.json({ error: "tidak diizinkan" }, { status: 403 });

  await prisma.status.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  if (!isOwner) {
    await modLog({
      moderatorId: user.id,
      moderatorName: user.username,
      action: "status.delete",
      targetType: "status",
      targetId: id,
      summary: "Status dihapus moderator",
    });
  }
  return NextResponse.json({ ok: true });
}
