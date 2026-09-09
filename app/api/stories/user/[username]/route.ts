import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Story aktif satu user (untuk ring di halaman profil). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { username } = await params;
  const author = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, name: true, image: true },
  });
  if (!author) return NextResponse.json(null, { status: 404 });

  const stories = await prisma.story.findMany({
    where: { authorId: author.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    include: {
      views: { where: { viewerId: me.id }, select: { id: true } },
      _count: { select: { views: true } },
    },
  });
  if (stories.length === 0) return NextResponse.json(null);

  const mine = me.id === author.id;
  const items = stories.map((s) => ({
    id: s.id,
    mediaUrl: s.mediaUrl,
    mediaType: s.mediaType,
    caption: s.caption,
    createdAt: s.createdAt.toISOString(),
    viewed: s.views.length > 0,
    views: s._count.views,
    mine,
  }));

  return NextResponse.json({
    username: author.username,
    name: author.name,
    image: author.image,
    allViewed: mine || items.every((i) => i.viewed),
    items,
  });
}
