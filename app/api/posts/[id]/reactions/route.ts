import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints, POINTS } from "@/lib/points";
import { notify } from "@/lib/notifications";
import { checkAchievements } from "@/lib/achievements";

export const runtime = "nodejs";

const ALLOWED = ["👍", "❤️", "🔥", "🎉", "😂", "😮", "😢"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const { emoji } = await req.json().catch(() => ({}));
  if (!ALLOWED.includes(emoji)) {
    return NextResponse.json({ error: "emoji tidak valid" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: { thread: { include: { category: true } } },
  });
  if (!post || post.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_emoji: { postId: id, userId: user.id, emoji } },
  });

  let active: boolean;
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    active = false;
  } else {
    await prisma.reaction.create({
      data: { postId: id, userId: user.id, emoji },
    });
    active = true;
    if (post.authorId && post.authorId !== user.id) {
      await awardPoints(post.authorId, POINTS.REACTION_RECEIVED);
      await checkAchievements(post.authorId);
      await notify({
        userId: post.authorId,
        actorId: user.id,
        type: "REACTION",
        title: `${user.name ?? user.username} bereaksi ${emoji}`,
        body: `di "${post.thread.title}"`,
        url: `/forum/${post.thread.category.slug}/${post.thread.slug}#post-${id}`,
      });
    }
  }

  const counts = await prisma.reaction.groupBy({
    by: ["emoji"],
    where: { postId: id },
    _count: { emoji: true },
  });

  return NextResponse.json({
    active,
    emoji,
    counts: counts.map((c) => ({ emoji: c.emoji, count: c._count.emoji })),
  });
}
