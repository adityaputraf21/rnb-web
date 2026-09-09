import slugify from "slugify";

/** Bikin slug username yang aman dari string bebas. */
export function toUsernameSlug(input: string): string {
  const base = slugify(input, { lower: true, strict: true, trim: true });
  return (base || "user").slice(0, 24);
}

/** Cari username unik: coba base, lalu base-1, base-2, ... */
export async function uniqueUsername(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const slug = toUsernameSlug(base);
  if (!(await exists(slug))) return slug;
  for (let i = 1; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}
