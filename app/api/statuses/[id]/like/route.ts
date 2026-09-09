import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
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
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const status = await prisma.status.findUnique({ where: { id } });
  if (!status || status.deletedAt)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await prisma.statusLike.findUnique({
    where: { statusId_userId: { statusId: id, userId: user.id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.statusLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.statusLike.create({ data: { statusId: id, userId: user.id } });
    liked = true;
    if (status.authorId && status.authorId !== user.id) {
      await awardPoints(status.authorId, 1);
      await notify({
        userId: status.authorId,
        actorId: user.id,
        type: "REACTION",
        title: `${user.name ?? user.username} menyukai statusmu`,
        url: `/feed/${id}`,
      });
    }
  }

  const count = await prisma.statusLike.count({ where: { statusId: id } });
  return NextResponse.json({ liked, count });
}
