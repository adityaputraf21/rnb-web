import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (story.authorId !== me.id && me.role === "USER")
    return NextResponse.json({ error: "tidak diizinkan" }, { status: 403 });

  await prisma.story.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
