import { NextResponse } from "next/server";
import { apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
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

  const original = await prisma.status.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, authorId: true, repostOfId: true },
  });
  if (!original)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const targetId = original.repostOfId ?? original.id;
  const target = await prisma.status.findUnique({
    where: { id: targetId },
    select: { authorId: true },
  });

  const { body } = await req.json().catch(() => ({}));
  const quote = typeof body === "string" ? body.trim().slice(0, 2000) : "";

  // Quote = post baru (boleh berkali-kali). Repost polos = toggle.
  if (quote) {
    const q = await prisma.status.create({
      data: { authorId: user.id, body: quote, repostOfId: targetId },
    });
    await awardPoints(user.id, 2);
    await notifyMentions({
      body: quote,
      actorId: user.id,
      actorName: user.name ?? user.username,
      url: `/feed/${q.id}`,
      context: "di quote",
    });
    if (target?.authorId && target.authorId !== user.id) {
      await notify({
        userId: target.authorId,
        actorId: user.id,
        type: "REACTION",
        title: `${user.name ?? user.username} mengutip statusmu`,
        body: quote.slice(0, 100),
        url: `/feed/${q.id}`,
      });
    }
    const count = await prisma.status.count({
      where: { repostOfId: targetId, deletedAt: null },
    });
    return NextResponse.json({ reposted: true, quoted: true, count });
  }

  const existing = await prisma.status.findFirst({
    where: {
      authorId: user.id,
      repostOfId: targetId,
      body: "",
      deletedAt: null,
    },
  });
  if (existing) {
    await prisma.status.delete({ where: { id: existing.id } });
  } else {
    await prisma.status.create({
      data: { authorId: user.id, body: "", repostOfId: targetId },
    });
    await awardPoints(user.id, 1);
    if (target?.authorId && target.authorId !== user.id) {
      await notify({
        userId: target.authorId,
        actorId: user.id,
        type: "REACTION",
        title: `${user.name ?? user.username} me-repost statusmu`,
        url: `/feed/${targetId}`,
      });
    }
  }

  const count = await prisma.status.count({
    where: { repostOfId: targetId, deletedAt: null },
  });
  return NextResponse.json({ reposted: !existing, count });
}
