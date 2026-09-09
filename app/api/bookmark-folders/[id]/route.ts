import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function owned(id: string, userId: string) {
  const f = await prisma.bookmarkFolder.findUnique({ where: { id } });
  return f && f.userId === userId ? f : null;
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
  if (!(await owned(id, user.id)))
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { name } = await req.json().catch(() => ({}));
  const clean = typeof name === "string" ? name.trim().slice(0, 40) : "";
  if (!clean)
    return NextResponse.json({ error: "nama folder wajib" }, { status: 400 });

  await prisma.bookmarkFolder.update({ where: { id }, data: { name: clean } });
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
  if (!(await owned(id, user.id)))
    return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.bookmark.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  await prisma.bookmarkFolder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
