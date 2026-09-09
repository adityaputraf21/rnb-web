import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

const ALLOWED = ["❤️", "🔥", "😂", "😮", "😢", "👏", "💯"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const { emoji } = await req.json().catch(() => ({}));
  if (!ALLOWED.includes(emoji))
    return NextResponse.json({ error: "emoji tidak valid" }, { status: 400 });

  const story = await prisma.story.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.storyReaction.upsert({
    where: { storyId_userId: { storyId: id, userId: me.id } },
    update: { emoji },
    create: { storyId: id, userId: me.id, emoji },
  });

  if (story.authorId && story.authorId !== me.id) {
    await notify({
      userId: story.authorId,
      actorId: me.id,
      type: "REACTION",
      title: `${me.name ?? me.username} bereaksi ${emoji} ke story kamu`,
      url: "/feed",
    });
  }
  return NextResponse.json({ ok: true, emoji });
}
