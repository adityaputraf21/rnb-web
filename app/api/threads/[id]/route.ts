import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

async function loadThread(id: string) {
  return prisma.thread.findUnique({
    where: { id },
    include: { category: true },
  });
}

// pin / lock  (moderator+)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  if (user.role === "USER") {
    return NextResponse.json({ error: "khusus moderator" }, { status: 403 });
  }

  const { id } = await params;
  const thread = await loadThread(id);
  if (!thread) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { pinned, locked } = await req.json().catch(() => ({}));
  const data: Record<string, boolean> = {};
  if (typeof pinned === "boolean") data.pinned = pinned;
  if (typeof locked === "boolean") data.locked = locked;

  const updated = await prisma.thread.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: {
      moderatorId: user.id,
      action: "thread.update",
      targetType: "thread",
      targetId: id,
      meta: data,
    },
  });
  if (thread.authorId) {
    await notify({
      userId: thread.authorId,
      actorId: user.id,
      type: "MOD_ACTION",
      title: `Thread "${thread.title}" diperbarui moderator`,
      body: Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", "),
      url: `/forum/${thread.category.slug}/${thread.slug}`,
    });
  }
  return NextResponse.json(updated);
}

// hapus (author atau moderator+) — soft delete
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const thread = await loadThread(id);
  if (!thread) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = thread.authorId === user.id;
  if (!isOwner && user.role === "USER") {
    return NextResponse.json({ error: "tidak diizinkan" }, { status: 403 });
  }

  await prisma.thread.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      moderatorId: user.id,
      action: "thread.delete",
      targetType: "thread",
      targetId: id,
      meta: { byOwner: isOwner },
    },
  });
  return NextResponse.json({ ok: true });
}
