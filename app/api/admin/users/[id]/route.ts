import { NextResponse } from "next/server";
import { apiRole, RANK } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { modLog } from "@/lib/mod-log";
import { tierForPoints } from "@/lib/tiers";

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

  // Tidak boleh menyentuh user dengan rank >= diri sendiri (kecuali diri sendiri).
  if (target.id !== actor.id && RANK[target.role] >= RANK[actor.role]) {
    return NextResponse.json(
      { error: "tidak bisa memoderasi user dengan level setara/lebih tinggi" },
      { status: 403 },
    );
  }

  const { role, banned, banReason, banDays, muteMinutes, pointsDelta } =
    await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const logs: string[] = [];

  if (typeof role === "string" && RANK[role as keyof typeof RANK] !== undefined) {
    if (actor.role !== "ADMIN" && actor.role !== "OWNER") {
      return NextResponse.json({ error: "khusus admin/owner" }, { status: 403 });
    }
    // Hanya OWNER yang boleh membuat/mencabut ADMIN atau OWNER.
    if (
      (role === "ADMIN" || role === "OWNER" || target.role === "ADMIN") &&
      actor.role !== "OWNER"
    ) {
      return NextResponse.json(
        { error: "hanya owner yang bisa mengatur admin" },
        { status: 403 },
      );
    }
    data.role = role;
    logs.push(`role → ${role}`);
  }

  if (typeof banned === "boolean") {
    data.bannedAt = banned ? new Date() : null;
    data.banReason = banned ? (banReason ?? null) : null;
    const days = Number(banDays);
    data.bannedUntil =
      banned && Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 86400000)
        : null;
    logs.push(
      banned
        ? `ban${data.bannedUntil ? ` ${days}h` : " permanen"}: ${banReason ?? "-"}`
        : "unban",
    );
  }

  if (Number.isFinite(muteMinutes)) {
    data.mutedUntil =
      muteMinutes > 0 ? new Date(Date.now() + muteMinutes * 60_000) : null;
    logs.push(muteMinutes > 0 ? `mute ${muteMinutes}m` : "unmute");
  }

  if (Number.isInteger(pointsDelta) && pointsDelta !== 0) {
    if (actor.role !== "ADMIN" && actor.role !== "OWNER") {
      return NextResponse.json({ error: "khusus admin/owner" }, { status: 403 });
    }
    const newPoints = Math.max(0, target.points + pointsDelta);
    data.points = newPoints;
    data.tier = tierForPoints(newPoints);
    logs.push(`poin ${pointsDelta > 0 ? "+" : ""}${pointsDelta}`);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data });

  await modLog({
    moderatorId: actor.id,
    moderatorName: actor.username,
    action: "user.update",
    targetType: "user",
    targetId: id,
    summary: `@${target.username}: ${logs.join(", ")}`,
    meta: data,
  });

  if ("bannedAt" in data || "mutedUntil" in data) {
    await notify({
      userId: id,
      actorId: actor.id,
      type: "MOD_ACTION",
      title:
        "bannedAt" in data && data.bannedAt
          ? "Akun kamu diblokir"
          : "mutedUntil" in data && data.mutedUntil
            ? "Kamu di-timeout sementara"
            : "Status moderasi akun kamu berubah",
      body: (data.banReason as string) ?? undefined,
    });
  }

  return NextResponse.json({
    id: updated.id,
    role: updated.role,
    bannedAt: updated.bannedAt,
    bannedUntil: updated.bannedUntil,
    mutedUntil: updated.mutedUntil,
    points: updated.points,
    tier: updated.tier,
  });
}
