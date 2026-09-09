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
  const friend = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (!friend || friend.id === me.id)
    return NextResponse.json({ error: "user tidak valid" }, { status: 400 });

  const existing = await prisma.closeFriend.findUnique({
    where: { ownerId_friendId: { ownerId: me.id, friendId: friend.id } },
  });
  if (existing) {
    await prisma.closeFriend.delete({ where: { id: existing.id } });
    return NextResponse.json({ close: false });
  }
  await prisma.closeFriend.create({
    data: { ownerId: me.id, friendId: friend.id },
  });
  return NextResponse.json({ close: true });
}
