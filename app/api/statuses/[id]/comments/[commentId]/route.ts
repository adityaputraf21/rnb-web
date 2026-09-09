import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { commentId } = await params;
  const comment = await prisma.statusComment.findUnique({
    where: { id: commentId },
  });
  if (!comment || comment.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  if (comment.authorId !== user.id && user.role === "USER")
    return NextResponse.json({ error: "tidak diizinkan" }, { status: 403 });

  await prisma.statusComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
