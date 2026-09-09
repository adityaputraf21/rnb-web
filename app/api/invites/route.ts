import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrCreateInvite } from "@/lib/invites";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const invite = await getOrCreateInvite(user.id);
  const invitees = await prisma.user.findMany({
    where: { invitedById: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { username: true, name: true, image: true, createdAt: true },
  });
  return NextResponse.json({
    code: invite.code,
    uses: invite.uses,
    pointsEarned: invitees.length * 25,
    invitees: invitees.map((u) => ({
      username: u.username,
      name: u.name,
      image: u.image,
      joinedAt: u.createdAt.toISOString(),
    })),
  });
}
