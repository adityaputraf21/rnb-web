import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { modLog } from "@/lib/mod-log";

export const runtime = "nodejs";

async function loadThread(id: string) {
  return prisma.thread.findUnique({
    where: { id },
    include: { category: true },
  });
}

// pin / lock / move  (moderator+)
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

  const { pinned, locked, categoryId } = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const changes: string[] = [];
  if (typeof pinned === "boolean") {
    data.pinned = pinned;
    changes.push(pinned ? "pin" : "unpin");
  }
  if (typeof locked === "boolean") {
    data.locked = locked;
    changes.push(locked ? "lock" : "unlock");
  }
  if (typeof categoryId === "string" && categoryId !== thread.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat)
      return NextResponse.json({ error: "kategori tujuan tidak ada" }, { status: 404 });
    data.categoryId = categoryId;
    changes.push(`pindah ke ${cat.name}`);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });
  }

  const updated = await prisma.thread.update({
    where: { id },
    data,
    include: { category: true },
  });

  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "thread.update",
    targetType: "thread",
    targetId: id,
    summary: `"${thread.title}": ${changes.join(", ")}`,
    meta: data,
  });

  if (thread.authorId) {
    await notify({
      userId: thread.authorId,
      actorId: user.id,
      type: "MOD_ACTION",
      title: `Thread "${thread.title}" diperbarui moderator`,
      body: changes.join(", "),
      url: `/forum/${updated.category.slug}/${updated.slug}`,
    });
  }
  return NextResponse.json({
    pinned: updated.pinned,
    locked: updated.locked,
    url: `/forum/${updated.category.slug}/${updated.slug}`,
  });
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
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "thread.delete",
    targetType: "thread",
    targetId: id,
    summary: `"${thread.title}" dihapus${isOwner ? " (oleh penulis)" : ""}`,
    meta: { byOwner: isOwner },
  });
  return NextResponse.json({ ok: true });
}
