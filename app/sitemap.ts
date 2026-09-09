import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb-web.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/forum", "/leaderboard", "/events", "/announcements"].map(
    (p) => ({ url: `${base}${p}`, lastModified: new Date() }),
  );

  const [categories, threads] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }).catch(() => []),
    prisma.thread
      .findMany({
        where: { deletedAt: null },
        select: { slug: true, lastPostAt: true, category: { select: { slug: true } } },
        orderBy: { lastPostAt: "desc" },
        take: 1000,
      })
      .catch(() => []),
  ]);

  return [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: `${base}/forum/${c.slug}`,
      lastModified: new Date(),
    })),
    ...threads.map((t) => ({
      url: `${base}/forum/${t.category.slug}/${t.slug}`,
      lastModified: t.lastPostAt,
    })),
  ];
}
