import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ threads: [], posts: [] });

  const [threads, posts] = await Promise.all([
    prisma.thread.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { posts: { some: { body: { contains: q, mode: "insensitive" }, deletedAt: null } } },
        ],
      },
      orderBy: { lastPostAt: "desc" },
      take: 15,
      include: {
        category: true,
        author: { select: { username: true, name: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.post.findMany({
      where: {
        deletedAt: null,
        body: { contains: q, mode: "insensitive" },
        thread: { deletedAt: null },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        author: { select: { username: true, name: true } },
        thread: { include: { category: true } },
      },
    }),
  ]);

  return NextResponse.json({
    threads: threads.map((t) => ({
      title: t.title,
      url: `/forum/${t.category.slug}/${t.slug}`,
      category: t.category.name,
      author: t.author?.name ?? t.author?.username ?? "?",
      posts: t._count.posts,
    })),
    posts: posts.map((p) => ({
      excerpt: p.body.slice(0, 200),
      url: `/forum/${p.thread.category.slug}/${p.thread.slug}#post-${p.id}`,
      threadTitle: p.thread.title,
      author: p.author?.name ?? p.author?.username ?? "?",
    })),
  });
}
