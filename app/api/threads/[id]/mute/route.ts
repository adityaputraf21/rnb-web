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
  const thread = await prisma.thread.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!thread)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await prisma.threadMute.findUnique({
    where: { userId_threadId: { userId: user.id, threadId: id } },
  });
  if (existing) {
    await prisma.threadMute.delete({ where: { id: existing.id } });
    return NextResponse.json({ muted: false });
  }
  await prisma.threadMute.create({
    data: { userId: user.id, threadId: id },
  });
  // matikan juga langganan supaya benar-benar senyap
  await prisma.threadSubscription
    .deleteMany({ where: { userId: user.id, threadId: id } })
    .catch(() => {});
  return NextResponse.json({ muted: true });
}
