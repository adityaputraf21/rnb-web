import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { modLog } from "@/lib/mod-log";

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
  const appeal = await prisma.appeal.findUnique({ where: { id } });
  if (!appeal)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (appeal.status !== "OPEN")
    return NextResponse.json({ error: "sudah ditinjau" }, { status: 400 });

  const { decision, note } = await req.json().catch(() => ({}));
  if (decision !== "accept" && decision !== "reject")
    return NextResponse.json({ error: "decision tidak valid" }, { status: 400 });

  const accepted = decision === "accept";

  await prisma.appeal.update({
    where: { id },
    data: {
      status: accepted ? "ACCEPTED" : "REJECTED",
      reviewerId: actor.id,
      note: typeof note === "string" ? note.trim().slice(0, 1000) || null : null,
      reviewedAt: new Date(),
    },
  });

  if (accepted) {
    await prisma.user.update({
      where: { id: appeal.userId },
      data: { bannedAt: null, banReason: null },
    });
  }

  await modLog({
    moderatorId: actor.id,
    moderatorName: actor.username,
    action: accepted ? "appeal.accept" : "appeal.reject",
    targetType: "appeal",
    targetId: id,
    summary: `Banding ${accepted ? "diterima (unban)" : "ditolak"}`,
  });

  await notify({
    userId: appeal.userId,
    actorId: actor.id,
    type: "MOD_ACTION",
    title: accepted
      ? "Bandingmu diterima — akun dipulihkan"
      : "Bandingmu ditolak",
    body: typeof note === "string" && note.trim() ? note.trim() : undefined,
  });

  return NextResponse.json({ ok: true });
}
