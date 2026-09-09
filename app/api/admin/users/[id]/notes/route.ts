import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const notes = await prisma.modNote.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { username: true } } },
  });
  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      body: n.body,
      author: n.author?.username ?? "sistem",
      createdAt: n.createdAt.toISOString(),
    })),
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const { body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim().slice(0, 2000) : "";
  if (!text)
    return NextResponse.json({ error: "catatan kosong" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!target)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const note = await prisma.modNote.create({
    data: { userId: id, authorId: actor.id, body: text },
  });
  return NextResponse.json({
    id: note.id,
    body: note.body,
    author: actor.username,
    createdAt: note.createdAt.toISOString(),
  });
}
