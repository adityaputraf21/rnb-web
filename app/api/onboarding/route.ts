import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { follow } = await req.json().catch(() => ({}));
  const usernames: string[] = Array.isArray(follow)
    ? follow.filter((x) => typeof x === "string").slice(0, 30)
    : [];

  if (usernames.length > 0) {
    const users = await prisma.user.findMany({
      where: { username: { in: usernames.map((u) => u.toLowerCase()) } },
      select: { id: true },
    });
    await prisma.follow.createMany({
      data: users
        .filter((u) => u.id !== me.id)
        .map((u) => ({ followerId: me.id, followingId: u.id })),
      skipDuplicates: true,
    });
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { onboardedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
