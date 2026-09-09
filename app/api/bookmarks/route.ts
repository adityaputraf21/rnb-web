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
  const { threadId } = await req.json().catch(() => ({}));
  if (!threadId)
    return NextResponse.json({ error: "threadId wajib" }, { status: 400 });

  const existing = await prisma.bookmark.findUnique({
    where: { userId_threadId: { userId: user.id, threadId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }
  await prisma.bookmark.create({ data: { userId: user.id, threadId } });
  return NextResponse.json({ bookmarked: true });
}
