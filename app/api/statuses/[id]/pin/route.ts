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
  const status = await prisma.status.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, authorId: true, pinned: true },
  });
  if (!status) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (status.authorId !== user.id)
    return NextResponse.json({ error: "bukan status kamu" }, { status: 403 });

  const pin = !status.pinned;
  if (pin) {
    // Hanya satu status ter-pin per user.
    await prisma.status.updateMany({
      where: { authorId: user.id, pinned: true },
      data: { pinned: false },
    });
  }
  await prisma.status.update({ where: { id }, data: { pinned: pin } });
  return NextResponse.json({ pinned: pin });
}
