import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
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
  const thread = await prisma.thread.findUnique({
    where: { id },
    select: { id: true, authorId: true, deletedAt: true },
  });
  if (!thread || thread.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (thread.authorId !== user.id)
    return NextResponse.json(
      { error: "hanya penulis yang bisa menyematkan" },
      { status: 403 },
    );

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { pinnedThreadId: true },
  });
  const pinned = me?.pinnedThreadId !== id;
  await prisma.user.update({
    where: { id: user.id },
    data: { pinnedThreadId: pinned ? id : null },
  });
  return NextResponse.json({ pinned });
}
