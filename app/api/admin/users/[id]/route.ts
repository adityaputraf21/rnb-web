import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

export async function PATCH(
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
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { role, banned, banReason } = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  // Ubah role hanya ADMIN, dan tidak boleh mengubah sesama ADMIN.
  if (typeof role === "string" && ["USER", "MODERATOR", "ADMIN"].includes(role)) {
    if (actor.role !== "ADMIN") {
      return NextResponse.json({ error: "khusus admin" }, { status: 403 });
    }
    if (target.role === "ADMIN" && target.id !== actor.id) {
      return NextResponse.json(
        { error: "tidak bisa mengubah admin lain" },
        { status: 403 },
      );
    }
    data.role = role;
  }

  if (typeof banned === "boolean") {
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "tidak bisa ban admin" }, { status: 403 });
    }
    data.bannedAt = banned ? new Date() : null;
    data.banReason = banned ? (banReason ?? null) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: {
      moderatorId: actor.id,
      action: "user.update",
      targetType: "user",
      targetId: id,
      meta: data as object,
    },
  });

  if ("bannedAt" in data) {
    await notify({
      userId: id,
      actorId: actor.id,
      type: "MOD_ACTION",
      title: data.bannedAt ? "Akun kamu diblokir" : "Blokir akun kamu dicabut",
      body: (data.banReason as string) ?? undefined,
    });
  }

  return NextResponse.json({
    id: updated.id,
    role: updated.role,
    bannedAt: updated.bannedAt,
  });
}
