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

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { scheduledFor } = await req.json().catch(() => ({}));
  if (!scheduledFor) {
    return NextResponse.json(
      { error: "scheduledFor (ISO date) wajib diisi" },
      { status: 400 },
    );
  }

  const date = new Date(scheduledFor);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "scheduledFor harus ISO date yang valid" },
      { status: 400 },
    );
  }

  const invite = await getOrCreateInvite(user.id);

  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: { scheduledFor: date },
  });

  return NextResponse.json(
    {
      message: "Reminder invitation dijadwalkan",
      code: updated.code,
      scheduledFor: updated.scheduledFor?.toISOString(),
    },
    { status: 200 },
  );
}
