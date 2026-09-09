import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!user.banned)
    return NextResponse.json(
      { error: "Akun kamu tidak diblokir." },
      { status: 400 },
    );

  const { body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim().slice(0, 2000) : "";
  if (text.length < 20)
    return NextResponse.json(
      { error: "Jelaskan minimal 20 karakter." },
      { status: 400 },
    );

  const open = await prisma.appeal.findFirst({
    where: { userId: user.id, status: "OPEN" },
    select: { id: true },
  });
  if (open)
    return NextResponse.json(
      { error: "Bandingmu masih dalam peninjauan." },
      { status: 409 },
    );

  await prisma.appeal.create({ data: { userId: user.id, body: text } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await prisma.appeal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(items);
}
