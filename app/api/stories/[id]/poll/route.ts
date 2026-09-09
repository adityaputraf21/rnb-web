import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

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
  const { choice } = await req.json().catch(() => ({}));

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story || story.expiresAt < new Date())
    return NextResponse.json({ error: "story tidak aktif" }, { status: 404 });
  if (
    !story.pollQuestion ||
    typeof choice !== "number" ||
    choice < 0 ||
    choice >= story.pollOptions.length
  )
    return NextResponse.json({ error: "pilihan tidak valid" }, { status: 400 });

  await prisma.storyPollVote.upsert({
    where: { storyId_userId: { storyId: id, userId: user.id } },
    create: { storyId: id, userId: user.id, choice },
    update: { choice },
  });

  if (story.authorId && story.authorId !== user.id) {
    void notify({
      userId: story.authorId,
      actorId: user.id,
      type: "REACTION",
      title: `${user.name ?? user.username} menjawab polling storymu`,
      body: story.pollOptions[choice],
      url: "/feed",
    });
  }

  const votes = await prisma.storyPollVote.findMany({
    where: { storyId: id },
    select: { choice: true },
  });
  const counts = story.pollOptions.map(
    (_, i) => votes.filter((v) => v.choice === i).length,
  );
  return NextResponse.json({ counts, myChoice: choice });
}
