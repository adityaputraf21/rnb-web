import { prisma } from "@/lib/prisma";

const TAG_RE = /(?:^|[^\w&])#([a-z0-9_]{2,30})/gi;

export function extractHashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(TAG_RE)) out.add(m[1].toLowerCase());
  return [...out].slice(0, 10);
}

/** Naikkan hitungan tag (best-effort, tidak menunggu). */
export async function bumpHashtags(text: string) {
  const tags = extractHashtags(text);
  if (tags.length === 0) return;
  await Promise.all(
    tags.map((tag) =>
      prisma.hashtag
        .upsert({
          where: { tag },
          update: { count: { increment: 1 }, lastUsedAt: new Date() },
          create: { tag, count: 1 },
        })
        .catch(() => {}),
    ),
  );
}
