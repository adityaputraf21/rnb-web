import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

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
  const { id } = await params;
  const thread = await prisma.thread.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!thread) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isAuthor = thread.authorId === user.id;
  if (!isAuthor && user.role === "USER")
    return NextResponse.json(
      { error: "hanya pembuat thread / moderator" },
      { status: 403 },
    );

  const { postId } = await req.json().catch(() => ({}));
  const clearing = !postId || postId === thread.bestPostId;

  let newBest: string | null = null;
  if (!clearing) {
    const post = await prisma.post.findFirst({
      where: { id: postId, threadId: id, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!post)
      return NextResponse.json({ error: "post tidak ada di thread ini" }, { status: 400 });
    newBest = post.id;

    if (post.authorId && post.authorId !== user.id) {
      await awardPoints(post.authorId, 15);
      await notify({
        userId: post.authorId,
        actorId: user.id,
        type: "MOD_ACTION",
        title: "Jawabanmu ditandai sebagai jawaban terbaik ✅",
        body: `di "${thread.title}" (+15 poin)`,
        url: `/forum/${thread.category.slug}/${thread.slug}#post-${post.id}`,
      });
    }
  }

  await prisma.thread.update({ where: { id }, data: { bestPostId: newBest } });
  return NextResponse.json({ bestPostId: newBest });
}
