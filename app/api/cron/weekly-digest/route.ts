import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb.web";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (req.headers.get("x-vercel-cron")) return true;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`)
    return true;
  return !secret; // kalau CRON_SECRET tidak diset, izinkan (dev)
}

async function run() {
  const since = new Date(Date.now() - 7 * 86400000);

  const [threads, statuses, newUsers, newThreads, newPosts] = await Promise.all([
    prisma.thread.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      orderBy: { posts: { _count: "desc" } },
      take: 5,
      include: {
        category: { select: { slug: true } },
        author: { select: { username: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.status.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      orderBy: { likes: { _count: "desc" } },
      take: 5,
      include: {
        author: { select: { username: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.thread.count({
      where: { createdAt: { gte: since }, deletedAt: null },
    }),
    prisma.post.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
  ]);

  const threadLines = threads
    .map(
      (t, i) =>
        `${i + 1}. [${t.title}](${SITE_URL}/forum/${t.category.slug}/${t.slug}) — ${t._count.posts} balasan`,
    )
    .join("\n");
  const statusLines = statuses
    .map(
      (s, i) =>
        `${i + 1}. [@${s.author?.username ?? "?"}](${SITE_URL}/feed/${s.id}) — ${s._count.likes} suka`,
    )
    .join("\n");

  await sendDiscordWebhook({
    category: "announcement",
    embed: {
      author: { name: "📊 Rekap Mingguan RnB" },
      title: "Sepekan terakhir",
      description: [
        `**${newUsers}** anggota baru · **${newThreads}** thread · **${newPosts}** balasan`,
        "",
        threadLines ? `**Thread teramai**\n${threadLines}` : "",
        "",
        statusLines ? `**Status terpopuler**\n${statusLines}` : "",
      ]
        .filter((l) => l !== "")
        .join("\n"),
    },
  });

  return { newUsers, newThreads, newPosts, threads: threads.length };
}

export async function GET(req: Request) {
  if (!authorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await run()) });
}

export const POST = GET;
