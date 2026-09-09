import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints, POINTS } from "@/lib/points";
import { notify, notifyMentions } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { threadId, body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || body.trim().length < 2 || !threadId) {
    return NextResponse.json({ error: "isi balasan kosong" }, { status: 400 });
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { category: true },
  });
  if (!thread || thread.deletedAt) {
    return NextResponse.json({ error: "thread tidak ada" }, { status: 404 });
  }
  if (thread.locked && user.role === "USER") {
    return NextResponse.json({ error: "thread terkunci" }, { status: 403 });
  }

  const now = new Date();
  const post = await prisma.post.create({
    data: { threadId, authorId: user.id, body: body.trim() },
  });
  await prisma.thread.update({
    where: { id: threadId },
    data: { lastPostAt: now },
  });

  await awardPoints(user.id, POINTS.POST);

  const url = `/forum/${thread.category.slug}/${thread.slug}#post-${post.id}`;

  if (thread.authorId && thread.authorId !== user.id) {
    await notify({
      userId: thread.authorId,
      actorId: user.id,
      type: "REPLY",
      title: `${user.name ?? user.username} membalas "${thread.title}"`,
      body: body.trim().slice(0, 140),
      url,
    });
  }
  await notifyMentions({
    body,
    actorId: user.id,
    actorName: user.name ?? user.username,
    url,
    context: `di "${thread.title}"`,
  });

  return NextResponse.json({ id: post.id, url }, { status: 201 });
}
