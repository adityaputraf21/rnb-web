import { getSiteConfig } from "@/lib/site-config";

let cached: { list: string[]; at: number } | null = null;

async function bannedWords(): Promise<string[]> {
  if (cached && Date.now() - cached.at < 60_000) return cached.list;
  const cfg = await getSiteConfig();
  const list = (cfg.bannedWords ?? "")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  cached = { list, at: Date.now() };
  return list;
}

/**
 * Cek teks terhadap daftar kata terlarang. Lempar Response 422 kalau kena.
 */
export async function assertClean(text: string) {
  if (!text) return;
  const words = await bannedWords();
  if (words.length === 0) return;
  const lower = text.toLowerCase();
  const hit = words.find((w) => lower.includes(w));
  if (hit) {
    throw new Response(
      JSON.stringify({ error: "Konten mengandung kata yang tidak diizinkan." }),
      { status: 422, headers: { "content-type": "application/json" } },
    );
  }
}
