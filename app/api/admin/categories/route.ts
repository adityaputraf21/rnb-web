import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { slugBase } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET() {
  try {
    await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const cats = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { threads: true } } },
  });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiRole("ADMIN");
  } catch (res) {
    return res as Response;
  }
  const { name, description, color } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "nama wajib" }, { status: 400 });
  }
  const count = await prisma.category.count();
  const cat = await prisma.category.create({
    data: {
      name: name.trim(),
      slug: `${slugBase(name, 40)}-${Math.random().toString(36).slice(2, 5)}`,
      description: description?.trim() || null,
      color: /^#[0-9a-f]{6}$/i.test(color ?? "") ? color : "#5865F2",
      position: count,
    },
  });
  await prisma.auditLog.create({
    data: {
      moderatorId: user.id,
      action: "category.create",
      targetType: "category",
      targetId: cat.id,
      meta: { name: cat.name },
    },
  });
  return NextResponse.json(cat, { status: 201 });
}
