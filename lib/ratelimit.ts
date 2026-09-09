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
