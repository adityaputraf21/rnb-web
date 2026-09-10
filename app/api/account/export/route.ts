import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const [user, threads, posts, statuses, comments, messages, listings, wikiRevs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: me.id },
        select: {
          username: true,
          name: true,
          email: true,
          bio: true,
          website: true,
          points: true,
          tier: true,
          role: true,
          createdAt: true,
          mutedKeywords: true,
          featuredAchievement: true,
        },
      }),
      prisma.thread.findMany({
        where: { authorId: me.id },
        select: { title: true, slug: true, createdAt: true },
      }),
      prisma.post.findMany({
        where: { authorId: me.id },
        select: { body: true, createdAt: true, threadId: true },
      }),
      prisma.status.findMany({
        where: { authorId: me.id },
        select: { body: true, createdAt: true },
      }),
      prisma.statusComment.findMany({
        where: { authorId: me.id },
        select: { body: true, createdAt: true },
      }),
      prisma.message.findMany({
        where: { senderId: me.id },
        select: { body: true, createdAt: true, mediaUrl: true },
      }),
      prisma.listing.findMany({
        where: { sellerId: me.id },
        select: { title: true, price: true, status: true, createdAt: true },
      }),
      prisma.wikiRevision.findMany({
        where: { editorId: me.id },
        select: { title: true, summary: true, createdAt: true },
      }),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: user,
    threads,
    posts,
    statuses,
    comments,
    directMessages: messages,
    marketplaceListings: listings,
    wikiEdits: wikiRevs,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="rnb-data-${me.username}.json"`,
    },
  });
}
