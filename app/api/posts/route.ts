import { NextResponse } from "next/server";
import { apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints, POINTS } from "@/lib/points";
import { notify, notifyMentions } from "@/lib/notifications";
import { subscribe, notifySubscribers } from "@/lib/subscriptions";
import { checkAchievements } from "@/lib/achievements";
import { assertPostRate } from "@/lib/ratelimit";
import { assertClean } from "@/lib/automod";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiWriter();
    await assertPostRate(user.id);
  } catch (res) {
    return res as Response;
  }

  const { threadId, body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || body.trim().length < 2 || !threadId) {
    return NextResponse.json({ error: "isi balasan kosong" }, { status: 400 });
  }

  try {
    await assertClean(body);
  } catch (res) {
    return res as Response;
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

  const post = await prisma.post.create({
    data: { threadId, authorId: user.id, body: body.trim() },
  });
  await prisma.thread.update({
    where: { id: threadId },
    data: { lastPostAt: new Date() },
  });

  await subscribe(user.id, threadId);
  await awardPoints(user.id, POINTS.POST);
  await checkAchievements(user.id);

  const url = `/forum/${thread.category.slug}/${thread.slug}#post-${post.id}`;
  const notified: string[] = [];

  if (thread.authorId && thread.authorId !== user.id) {
    await notify({
      userId: thread.authorId,
      actorId: user.id,
      type: "REPLY",
      title: `${user.name ?? user.username} membalas "${thread.title}"`,
      body: body.trim().slice(0, 140),
      url,
    });
    notified.push(thread.authorId);
  }
  await notifySubscribers({
    threadId,
    threadTitle: thread.title,
    actorId: user.id,
    actorName: user.name ?? user.username,
    url,
    excludeUserIds: notified,
  });
  await notifyMentions({
    body,
    actorId: user.id,
    actorName: user.name ?? user.username,
    url,
    context: `di "${thread.title}"`,
  });

  return NextResponse.json({ id: post.id, url }, { status: 201 });
}
