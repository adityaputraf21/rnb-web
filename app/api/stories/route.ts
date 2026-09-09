import { NextResponse } from "next/server";
import { apiWriter, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { blockedIdsFor } from "@/lib/blocks";

export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json([], { status: 401 });
  const now = new Date();
  const hidden = me ? await blockedIdsFor(me.id) : new Set<string>();

  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      ...(hidden.size ? { authorId: { notIn: [...hidden] } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { username: true, name: true, image: true } },
      views: me ? { where: { viewerId: me.id }, select: { id: true } } : false,
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
        caption: string | null;
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
    g.items.push({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
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
  } catch (res) {
    return res as Response;
  }

  const { mediaUrl, mediaType, caption } = await req.json().catch(() => ({}));
  if (typeof mediaUrl !== "string" || !/^https:\/\//.test(mediaUrl))
    return NextResponse.json({ error: "media wajib" }, { status: 400 });
  const type = ["image", "video"].includes(mediaType) ? mediaType : "image";
  const cap = typeof caption === "string" ? caption.trim().slice(0, 200) : "";

  const story = await prisma.story.create({
    data: {
      authorId: user.id,
      mediaUrl,
      mediaType: type,
      caption: cap || null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({ id: story.id }, { status: 201 });
}
