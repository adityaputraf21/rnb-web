import { NextResponse } from "next/server";
import { apiWriter, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notifyMentions } from "@/lib/notifications";
import { checkAchievements } from "@/lib/achievements";
import { assertPostRate } from "@/lib/ratelimit";

export const runtime = "nodejs";

const PAGE = 15;

export async function GET(req: Request) {
  const cursor = new URL(req.url).searchParams.get("cursor") ?? undefined;
  const me = await getCurrentUser();

  const rows = await prisma.status.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: {
        select: {
          username: true,
          name: true,
          image: true,
          role: true,
          tier: true,
        },
      },
      images: { orderBy: { position: "asc" } },
      likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
      _count: { select: { likes: true, comments: true } },
    },
  });

  const next = rows.length > PAGE ? rows.pop()!.id : null;

  const items = rows.map((s) => ({
    id: s.id,
    body: s.body,
    createdAt: s.createdAt.toISOString(),
    editedAt: s.editedAt?.toISOString() ?? null,
    images: s.images.map((i) => i.url),
    likeCount: s._count.likes,
    commentCount: s._count.comments,
    liked: me ? (s.likes as { id: string }[]).length > 0 : false,
    mine: !!me && s.author?.username === me.username,
    author: s.author,
  }));

  return NextResponse.json({ items, nextCursor: next });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiWriter();
    await assertPostRate(user.id);
  } catch (res) {
    return res as Response;
  }

  const { body, images } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim() : "";
  const imgs: string[] = Array.isArray(images)
    ? images
        .filter((u) => typeof u === "string" && /^https:\/\//.test(u))
        .slice(0, 4)
    : [];

  if (text.length === 0 && imgs.length === 0) {
    return NextResponse.json(
      { error: "tulis sesuatu atau tambahkan gambar" },
      { status: 400 },
    );
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "maksimal 2000 karakter" }, { status: 400 });
  }

  const status = await prisma.status.create({
    data: {
      authorId: user.id,
      body: text,
      images: { create: imgs.map((url, i) => ({ url, position: i })) },
    },
  });

  await awardPoints(user.id, 3);
  await checkAchievements(user.id);
  await notifyMentions({
    body: text,
    actorId: user.id,
    actorName: user.name ?? user.username,
    url: `/feed/${status.id}`,
    context: "di feed",
  });

  return NextResponse.json({ id: status.id }, { status: 201 });
}
