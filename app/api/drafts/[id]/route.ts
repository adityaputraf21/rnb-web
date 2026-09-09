import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft || draft.userId !== user.id)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.draft.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
