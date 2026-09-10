import { prisma } from "@/lib/prisma";

/**
 * Anti-spam sederhana berbasis DB: batasi jumlah konten baru per user
 * dalam jendela waktu. Lempar Response 429 kalau kelewatan.
 */
export async function assertPostRate(userId: string) {
  const since = new Date(Date.now() - 30_000);
  const [posts, threads] = await Promise.all([
    prisma.post.count({ where: { authorId: userId, createdAt: { gte: since } } }),
    prisma.thread.count({
      where: { authorId: userId, createdAt: { gte: since } },
    }),
  ]);
  if (posts + threads >= 4) {
    throw new Response(
      JSON.stringify({ error: "Terlalu cepat memposting. Coba lagi sebentar." }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }
}

function tooMany(): never {
  throw new Response(
    JSON.stringify({ error: "Terlalu cepat. Coba lagi sebentar." }),
    { status: 429, headers: { "content-type": "application/json" } },
  );
}

/** Maks 5 iklan / 10 menit. */
export async function assertListingRate(userId: string) {
  const n = await prisma.listing.count({
    where: { sellerId: userId, createdAt: { gte: new Date(Date.now() - 600_000) } },
  });
  if (n >= 5) tooMany();
}

/** Maks 10 suntingan wiki / 3 menit. */
export async function assertWikiRate(userId: string) {
  const n = await prisma.wikiRevision.count({
    where: { editorId: userId, createdAt: { gte: new Date(Date.now() - 180_000) } },
  });
  if (n >= 10) tooMany();
}

/** Maks 5 panggilan keluar / menit. */
export async function assertCallRate(userId: string) {
  const n = await prisma.callSession.count({
    where: { callerId: userId, startedAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (n >= 5) tooMany();
}

/** Maks 8 story / jam. */
export async function assertStoryRate(userId: string) {
  const n = await prisma.story.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (n >= 8) tooMany();
}
