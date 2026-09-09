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
  const folders = await prisma.bookmarkFolder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { bookmarks: true } } },
  });
  return NextResponse.json(
    folders.map((f) => ({ id: f.id, name: f.name, count: f._count.bookmarks })),
  );
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { name } = await req.json().catch(() => ({}));
  const clean = typeof name === "string" ? name.trim().slice(0, 40) : "";
  if (!clean)
    return NextResponse.json({ error: "nama folder wajib" }, { status: 400 });

  const count = await prisma.bookmarkFolder.count({ where: { userId: user.id } });
  if (count >= 30)
    return NextResponse.json({ error: "maksimal 30 folder" }, { status: 400 });

  const folder = await prisma.bookmarkFolder.create({
    data: { userId: user.id, name: clean },
  });
  return NextResponse.json({ id: folder.id, name: folder.name, count: 0 });
}
