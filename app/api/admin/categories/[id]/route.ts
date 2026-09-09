import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiRole("ADMIN");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const { name, description, color, position, locked } = await req
    .json()
    .catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof description === "string") data.description = description.trim() || null;
  if (/^#[0-9a-f]{6}$/i.test(color ?? "")) data.color = color;
  if (Number.isInteger(position)) data.position = position;
  if (typeof locked === "boolean") data.locked = locked;

  const cat = await prisma.category.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: {
      moderatorId: user.id,
      action: "category.update",
      targetType: "category",
      targetId: id,
      meta: data as object,
    },
  });
  return NextResponse.json(cat);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiRole("ADMIN");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      moderatorId: user.id,
      action: "category.delete",
      targetType: "category",
      targetId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
