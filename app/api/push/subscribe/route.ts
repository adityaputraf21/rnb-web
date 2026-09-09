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
  const sub = await req.json().catch(() => null);
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth)
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: me.id, p256dh, auth },
    create: { userId: me.id, endpoint, p256dh, auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  try {
    await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { endpoint } = await req.json().catch(() => ({}));
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
  return NextResponse.json({ ok: true });
}
