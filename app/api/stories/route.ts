import { NextResponse } from "next/server";
import { apiWriter, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { blockedIdsFor } from "@/lib/blocks";
import { assertStoryRate } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json([], { status: 401 });
  const now = new Date();
  const [hidden, closeGrantors] = await Promise.all([
    blockedIdsFor(me.id),
    prisma.closeFriend.findMany({
      where: { friendId: me.id },
      select: { ownerId: true },
    }),
  ]);
  const closeIds = closeGrantors.map((c) => c.ownerId);

  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      ...(hidden.size ? { authorId: { notIn: [...hidden] } } : {}),
      OR: [
        { audience: "all" },
        { authorId: me.id },
        { authorId: { in: closeIds } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { username: true, name: true, image: true } },
      views: me ? { where: { viewerId: me.id }, select: { id: true } } : false,
      pollVotes: { select: { userId: true, choice: true } },
      _count: { select: { views: true } },
    },
  });

  // Kelompokkan per author
  const groups = new Map<
    string,
    {
      username: string;
      name: string | null;
      image: string | null;
      allViewed: boolean;
      items: {
        id: string;
        mediaUrl: string;
        mediaType: string;
        bgColor: string | null;
        caption: string | null;
        audience: string;
        pollQuestion: string | null;
        pollOptions: string[];
        pollCounts: number[];
        myPollChoice: number | null;
        createdAt: string;
        viewed: boolean;
        views: number;
        mine: boolean;
      }[];
    }
  >();

  for (const s of stories) {
    if (!s.author) continue;
    const key = s.author.username;
    if (!groups.has(key)) {
      groups.set(key, {
        username: s.author.username,
        name: s.author.name,
        image: s.author.image,
        allViewed: true,
        items: [],
      });
    }
    const g = groups.get(key)!;
    const viewed = me ? (s.views as { id: string }[]).length > 0 : false;
    const mine = !!me && s.author.username === me.username;
    if (!viewed && !mine) g.allViewed = false;
    const pollCounts = s.pollOptions.map(
      (_, i) => s.pollVotes.filter((v) => v.choice === i).length,
    );
    const myVote = s.pollVotes.find((v) => v.userId === me.id);
    g.items.push({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      bgColor: s.bgColor,
      caption: s.caption,
      audience: s.audience,
      pollQuestion: s.pollQuestion,
      pollOptions: s.pollOptions,
      pollCounts,
      myPollChoice: myVote ? myVote.choice : null,
      createdAt: s.createdAt.toISOString(),
      viewed,
      views: s._count.views,
      mine,
    });
  }

  // Story sendiri di depan
  const arr = [...groups.values()];
  arr.sort((a, b) => {
    const am = me && a.username === me.username ? 0 : 1;
    const bm = me && b.username === me.username ? 0 : 1;
    if (am !== bm) return am - bm;
    return Number(a.allViewed) - Number(b.allViewed);
  });

  return NextResponse.json(arr);
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiWriter();
    await assertStoryRate(user.id);
  } catch (res) {
    return res as Response;
  }

  const { mediaUrl, mediaType, caption, bgColor, audience, poll } = await req
    .json()
    .catch(() => ({}));
  const type = ["image", "video", "text"].includes(mediaType)
    ? mediaType
    : "image";
  const cap = typeof caption === "string" ? caption.trim().slice(0, 280) : "";

  if (type === "text") {
    if (!cap) return NextResponse.json({ error: "tulis sesuatu" }, { status: 400 });
  } else if (typeof mediaUrl !== "string" || !/^https:\/\//.test(mediaUrl)) {
    return NextResponse.json({ error: "media wajib" }, { status: 400 });
  }

  const pollQuestion =
    poll && typeof poll.question === "string" && poll.question.trim()
      ? poll.question.trim().slice(0, 120)
      : null;
  const pollOptions: string[] =
    pollQuestion && Array.isArray(poll.options)
      ? poll.options
          .map((o: unknown) => String(o).trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 4)
      : [];

  const story = await prisma.story.create({
    data: {
      authorId: user.id,
      mediaUrl: type === "text" ? "" : mediaUrl,
      mediaType: type,
      bgColor: /^#[0-9a-f]{6}$/i.test(bgColor ?? "") ? bgColor : null,
      caption: cap || null,
      audience: audience === "close" ? "close" : "all",
      pollQuestion: pollOptions.length >= 2 ? pollQuestion : null,
      pollOptions: pollOptions.length >= 2 ? pollOptions : [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({ id: story.id }, { status: 201 });
}
