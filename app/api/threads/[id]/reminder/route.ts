import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { id: threadId } = await params;
  const reminder = await prisma.threadReminder.findUnique({
    where: { threadId_userId: { threadId, userId: user.id } },
  });

  return NextResponse.json({ reminder });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { id: threadId } = await params;
  const { scheduledFor } = await req.json().catch(() => ({}));

  if (!scheduledFor) {
    return NextResponse.json(
      { error: "scheduledFor (ISO datetime) wajib diisi" },
      { status: 400 },
    );
  }

  const date = new Date(scheduledFor);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "scheduledFor harus ISO datetime yang valid" },
      { status: 400 },
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, deletedAt: true },
  });

  if (!thread || thread.deletedAt) {
    return NextResponse.json({ error: "Thread tidak ditemukan" }, { status: 404 });
  }

  const reminder = await prisma.threadReminder.upsert({
    where: { threadId_userId: { threadId, userId: user.id } },
    create: { threadId, userId: user.id, scheduledFor: date },
    update: { scheduledFor: date },
  });

  return NextResponse.json(
    {
      message: "Reminder thread dijadwalkan",
      reminder: {
        threadId: reminder.threadId,
        scheduledFor: reminder.scheduledFor.toISOString(),
      },
    },
    { status: 200 },
  );
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { id: threadId } = await params;

  await prisma.threadReminder.deleteMany({
    where: { threadId, userId: user.id },
  });

  return NextResponse.json({ message: "Reminder dihapus" });
}
