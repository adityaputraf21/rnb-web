import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { issueWarning } from "@/lib/warnings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let mod;
  try {
    mod = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { userId, reason, severity } = await req.json().catch(() => ({}));
  if (!userId || typeof reason !== "string" || reason.trim().length < 3)
    return NextResponse.json({ error: "userId & alasan wajib" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.role !== "USER")
    return NextResponse.json(
      { error: "tidak bisa memperingatkan staf" },
      { status: 403 },
    );

  const result = await issueWarning({
    userId,
    moderatorId: mod.id,
    moderatorName: mod.username,
    reason: reason.trim().slice(0, 300),
    severity: Number.isInteger(severity) ? severity : 1,
  });
  return NextResponse.json(result);
}
