const URL_RE = /https?:\/\/[^\s<>()]+/i;

/** URL pertama dalam teks (client-safe, tanpa dependensi server). */
export function firstUrl(text: string): string | null {
  return text.match(URL_RE)?.[0]?.replace(/[.,;:]+$/, "") ?? null;
}
