import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

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
    select: { id: true, name: true, username: true },
  });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.id === me.id)
    return NextResponse.json({ error: "tidak bisa follow diri sendiri" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: me.id, followingId: target.id },
    },
  });

  let following: boolean;
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    following = false;
  } else {
    await prisma.follow.create({
      data: { followerId: me.id, followingId: target.id },
    });
    following = true;
    await notify({
      userId: target.id,
      actorId: me.id,
      type: "FOLLOW",
      title: `${me.name ?? me.username} mulai mengikuti kamu`,
      url: `/u/${me.username}`,
    });
  }

  const count = await prisma.follow.count({
    where: { followingId: target.id },
  });
  return NextResponse.json({ following, count });
}
