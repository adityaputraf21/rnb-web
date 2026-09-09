import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { modLog } from "@/lib/mod-log";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let mod;
  try {
    mod = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const { status, resolution, action } = await req.json().catch(() => ({}));
  if (!["RESOLVED", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "status tidak valid" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Aksi opsional: hapus konten yang dilaporkan.
  if (action === "delete" && status === "RESOLVED") {
    const now = new Date();
    if (report.targetType === "post") {
      await prisma.post.updateMany({
        where: { id: report.targetId },
        data: { deletedAt: now },
      });
    } else if (report.targetType === "status") {
      await prisma.status.updateMany({
        where: { id: report.targetId },
        data: { deletedAt: now },
      });
    } else {
      await prisma.thread.updateMany({
        where: { id: report.targetId },
        data: { deletedAt: now },
      });
    }
  }

  await prisma.report.update({
    where: { id },
    data: {
      status,
      resolution: resolution?.slice(0, 500) ?? null,
      resolverId: mod.id,
      resolvedAt: new Date(),
    },
  });

  await modLog({
    moderatorId: mod.id,
    moderatorName: mod.username,
    action: `report.${status.toLowerCase()}`,
    targetType: report.targetType,
    targetId: report.targetId,
    summary: `Laporan ${status}${action === "delete" ? " + konten dihapus" : ""}${
      resolution ? `: ${resolution}` : ""
    }`,
  });

  return NextResponse.json({ ok: true });
}
