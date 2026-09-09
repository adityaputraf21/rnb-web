import { prisma } from "@/lib/prisma";

export type Preview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export { firstUrl } from "@/lib/url-util";

function meta(html: string, ...names: string[]): string | null {
  for (const n of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${n}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return m[1];
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${n}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2) return m2[1];
  }
  return null;
}

const TTL = 7 * 24 * 60 * 60 * 1000;

export async function getLinkPreview(url: string): Promise<Preview | null> {
  if (!/^https?:\/\//.test(url)) return null;

  const cached = await prisma.linkPreview.findUnique({ where: { url } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < TTL) {
    return cached;
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; RnBBot/1.0)" },
    });
    clearTimeout(t);
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.includes("text/html")) return null;
    const html = (await res.text()).slice(0, 200_000);

    const data = {
      url,
      title:
        meta(html, "og:title", "twitter:title") ??
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
        null,
      description: meta(html, "og:description", "twitter:description", "description"),
      image: meta(html, "og:image", "twitter:image"),
      siteName: meta(html, "og:site_name") ?? new URL(url).hostname,
    };
    if (!data.title && !data.image) return null;

    await prisma.linkPreview.upsert({
      where: { url },
      update: { ...data, fetchedAt: new Date() },
      create: data,
    });
    return data;
  } catch {
    return cached ?? null;
  }
}
