import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.id === me.id)
    return NextResponse.json({ error: "tidak bisa blokir diri sendiri" }, { status: 400 });

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId: target.id } },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }
  await prisma.block.create({
    data: { blockerId: me.id, blockedId: target.id },
  });
  // Unfollow dua arah saat blokir.
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: me.id, followingId: target.id },
        { followerId: target.id, followingId: me.id },
      ],
    },
  });
  return NextResponse.json({ blocked: true });
}
