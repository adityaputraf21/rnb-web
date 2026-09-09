import { NextResponse } from "next/server";
import { apiWriter, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";
import { notifyMentions } from "@/lib/notifications";
import { checkAchievements } from "@/lib/achievements";
import { assertPostRate } from "@/lib/ratelimit";
import { assertClean } from "@/lib/automod";
import { blockedIdsFor } from "@/lib/blocks";
import { shapeStatus, statusInclude } from "@/lib/status-shape";

export const runtime = "nodejs";

const PAGE = 15;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const cursor = sp.get("cursor") ?? undefined;
  const filter = sp.get("filter"); // "following"
  const sort = sp.get("sort"); // "top"
  const me = await getCurrentUser();

  let authorFilter: { authorId?: { in: string[] } | { notIn: string[] } } = {};
  if (filter === "following" && me) {
    const f = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    });
    authorFilter = { authorId: { in: [...f.map((x) => x.followingId), me.id] } };
  } else if (me) {
    const hidden = await blockedIdsFor(me.id);
    if (hidden.size) authorFilter = { authorId: { notIn: [...hidden] } };
  }

  const rows = await prisma.status.findMany({
    where: { deletedAt: null, ...authorFilter },
    orderBy:
      sort === "top"
        ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: statusInclude(me?.id),
  });

  const next = rows.length > PAGE ? rows.pop()!.id : null;
  const items = rows.map((s) => shapeStatus(s, me));

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

  const { body, images, poll } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim() : "";
  const imgs: string[] = Array.isArray(images)
    ? images.filter((u) => typeof u === "string" && /^https:\/\//.test(u)).slice(0, 4)
    : [];

  if (text.length === 0 && imgs.length === 0 && !poll) {
    return NextResponse.json(
      { error: "tulis sesuatu atau tambahkan gambar" },
      { status: 400 },
    );
  }
  if (text.length > 2000)
    return NextResponse.json({ error: "maksimal 2000 karakter" }, { status: 400 });

  try {
    await assertClean(text);
  } catch (res) {
    return res as Response;
  }

  const pollOptions: string[] =
    poll && Array.isArray(poll.options)
      ? poll.options
          .map((o: unknown) => String(o).trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];

  const status = await prisma.status.create({
    data: {
      authorId: user.id,
      body: text,
      images: { create: imgs.map((url, i) => ({ url, position: i })) },
      ...(pollOptions.length >= 2 && poll?.question
        ? {
            poll: {
              create: {
                question: String(poll.question).slice(0, 200),
                multiple: !!poll.multiple,
                options: {
                  create: pollOptions.map((textOpt, i) => ({
                    text: textOpt.slice(0, 100),
                    position: i,
                  })),
                },
              },
            },
          }
        : {}),
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
