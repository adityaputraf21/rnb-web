import { NextResponse } from "next/server";
import { apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify, notifyMentions } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const status = await prisma.status.findUnique({ where: { id } });
  if (!status || status.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { body, parentId } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || body.trim().length < 1)
    return NextResponse.json({ error: "komentar kosong" }, { status: 400 });

  let parent: string | null = null;
  if (parentId) {
    const p = await prisma.statusComment.findFirst({
      where: { id: parentId, statusId: id, deletedAt: null },
      select: { id: true, parentId: true },
    });
    // maksimal 1 tingkat: balasan dari balasan tetap menempel ke parent teratas
    parent = p ? (p.parentId ?? p.id) : null;
  }

  const comment = await prisma.statusComment.create({
    data: {
      statusId: id,
      authorId: user.id,
      parentId: parent,
      body: body.trim().slice(0, 1000),
    },
    include: {
      author: { select: { username: true, name: true, image: true } },
    },
  });

  const url = `/feed/${id}`;
  if (status.authorId && status.authorId !== user.id) {
    await notify({
      userId: status.authorId,
      actorId: user.id,
      type: "REPLY",
      title: `${user.name ?? user.username} mengomentari statusmu`,
      body: body.trim().slice(0, 120),
      url,
    });
  }
  await notifyMentions({
    body,
    actorId: user.id,
    actorName: user.name ?? user.username,
    url,
    context: "di komentar feed",
  });

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    author: comment.author,
  });
}
