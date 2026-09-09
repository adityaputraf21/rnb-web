import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notifications";

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
  if (!ALLOWED.includes(emoji))
    return NextResponse.json({ error: "emoji tidak valid" }, { status: 400 });

  const status = await prisma.status.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, authorId: true },
  });
  if (!status) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await prisma.statusReaction.findUnique({
    where: { statusId_userId_emoji: { statusId: id, userId: user.id, emoji } },
  });

  let active: boolean;
  if (existing) {
    await prisma.statusReaction.delete({ where: { id: existing.id } });
    active = false;
  } else {
    await prisma.statusReaction.create({
      data: { statusId: id, userId: user.id, emoji },
    });
    active = true;
    if (status.authorId && status.authorId !== user.id) {
      await awardPoints(status.authorId, 1);
      await notify({
        userId: status.authorId,
        actorId: user.id,
        type: "REACTION",
        title: `${user.name ?? user.username} bereaksi ${emoji} di statusmu`,
        url: `/feed/${id}`,
      });
    }
  }

  const counts = await prisma.statusReaction.groupBy({
    by: ["emoji"],
    where: { statusId: id },
    _count: { emoji: true },
  });
  return NextResponse.json({
    active,
    emoji,
    counts: counts.map((c) => ({ emoji: c.emoji, count: c._count.emoji })),
  });
}
