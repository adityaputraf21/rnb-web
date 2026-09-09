import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { modLog } from "@/lib/mod-log";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { title, date, description, location } = await req
    .json()
    .catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof title === "string" && title.trim()) data.title = title.trim();
  if (typeof description === "string")
    data.description = description.trim() || null;
  if (typeof location === "string") data.location = location.trim() || null;
  if (typeof date === "string" && date.trim()) {
    const parsed = new Date(date);
    data.dateLabel = date;
    data.startsAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });

  const updated = await prisma.event.update({ where: { id }, data });
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "event.update",
    targetType: "event",
    targetId: id,
    summary: `"${updated.title}" diperbarui`,
    meta: data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.event.delete({ where: { id } });
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "event.delete",
    targetType: "event",
    targetId: id,
    summary: `"${existing.title}" dihapus`,
  });
  return NextResponse.json({ ok: true });
}
