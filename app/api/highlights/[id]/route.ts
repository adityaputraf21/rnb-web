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
  const h = await prisma.highlight.findUnique({ where: { id } });
  if (!h || h.userId !== me.id)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.highlight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
