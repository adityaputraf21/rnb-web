import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { subscribe, unsubscribe } from "@/lib/subscriptions";

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
  const existing = await prisma.threadSubscription.findUnique({
    where: { userId_threadId: { userId: user.id, threadId: id } },
  });
  if (existing) {
    await unsubscribe(user.id, id);
    return NextResponse.json({ subscribed: false });
  }
  await subscribe(user.id, id);
  return NextResponse.json({ subscribed: true });
}
