import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { threadId, statusId } = await req.json().catch(() => ({}));
  if (!threadId && !statusId)
    return NextResponse.json({ error: "threadId / statusId wajib" }, { status: 400 });

  const where = threadId
    ? { userId_threadId: { userId: user.id, threadId } }
    : { userId_statusId: { userId: user.id, statusId } };

  const existing = await prisma.bookmark.findUnique({ where });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }
  await prisma.bookmark.create({
    data: { userId: user.id, threadId: threadId ?? null, statusId: statusId ?? null },
  });
  return NextResponse.json({ bookmarked: true });
}
