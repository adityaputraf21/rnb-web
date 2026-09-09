import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return NextResponse.json({ items, unread });
}

export async function PATCH() {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
