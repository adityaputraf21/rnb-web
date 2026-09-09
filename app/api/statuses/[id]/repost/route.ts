import { NextResponse } from "next/server";
import { apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiWriter();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;

  const original = await prisma.status.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, authorId: true, repostOfId: true },
  });
  if (!original)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  // repost dari repost -> tunjuk ke aslinya
  const targetId = original.repostOfId ?? original.id;

  const existing = await prisma.status.findFirst({
    where: { authorId: user.id, repostOfId: targetId, deletedAt: null },
  });

  if (existing) {
    await prisma.status.delete({ where: { id: existing.id } });
    const count = await prisma.status.count({
      where: { repostOfId: targetId, deletedAt: null },
    });
    return NextResponse.json({ reposted: false, count });
  }

  await prisma.status.create({
    data: { authorId: user.id, body: "", repostOfId: targetId },
  });
  await awardPoints(user.id, 1);

  const target = await prisma.status.findUnique({
    where: { id: targetId },
    select: { authorId: true },
  });
  if (target?.authorId && target.authorId !== user.id) {
    await notify({
      userId: target.authorId,
      actorId: user.id,
      type: "REACTION",
      title: `${user.name ?? user.username} me-repost statusmu`,
      url: `/feed/${targetId}`,
    });
  }

  const count = await prisma.status.count({
    where: { repostOfId: targetId, deletedAt: null },
  });
  return NextResponse.json({ reposted: true, count });
}
