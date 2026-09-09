const IMG_MD = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i;
const IMG_URL =
  /(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|avif)(?:\?[^\s)]*)?)/i;

/** URL gambar pertama di dalam teks markdown (untuk embed Discord). */
export function firstImageUrl(md: string): string | undefined {
  return md.match(IMG_MD)?.[1] ?? md.match(IMG_URL)?.[1];
}

/**
 * Ubah markdown jadi teks polos ringkas untuk deskripsi embed:
 * buang gambar, ubah link [teks](url) -> teks, rapikan spasi.
 */
export function toPlainExcerpt(md: string, max = 300): string {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // gambar
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // link -> teks
    .replace(/[*_`>#~|]/g, "") // simbol markdown
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
