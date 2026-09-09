import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 900;

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb-web.vercel.app";

function esc(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

export async function GET() {
  const [threads, announcements] = await Promise.all([
    prisma.thread.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { category: true, author: { select: { username: true, name: true } } },
    }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  const items = [
    ...threads.map((t) => ({
      title: t.title,
      link: `${base}/forum/${t.category.slug}/${t.slug}`,
      date: t.createdAt,
      desc: `Thread di ${t.category.name} oleh ${t.author?.name ?? t.author?.username ?? "?"}`,
    })),
    ...announcements.map((a) => ({
      title: `[Pengumuman] ${a.title}`,
      link: `${base}/announcements`,
      date: a.createdAt,
      desc: a.body.slice(0, 300),
    })),
  ]
    .sort((x, y) => y.date.getTime() - x.date.getTime())
    .slice(0, 40);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>RnB Komunitas</title>
<link>${base}</link>
<description>Thread forum &amp; pengumuman terbaru</description>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${i.link}</link>
<guid>${i.link}</guid>
<pubDate>${i.date.toUTCString()}</pubDate>
<description>${esc(i.desc)}</description>
</item>`,
  )
  .join("\n")}
</channel></rss>`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
