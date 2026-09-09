export const LISTING_CATEGORIES = [
  { slug: "elektronik", label: "Elektronik" },
  { slug: "komputer", label: "Komputer & Gadget" },
  { slug: "fashion", label: "Fashion" },
  { slug: "hobi", label: "Hobi & Koleksi" },
  { slug: "gaming", label: "Gaming" },
  { slug: "jasa", label: "Jasa" },
  { slug: "kendaraan", label: "Kendaraan" },
  { slug: "rumah", label: "Rumah Tangga" },
  { slug: "lainnya", label: "Lainnya" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  LISTING_CATEGORIES.map((c) => [c.slug, c.label]),
);

export function isCategory(v: unknown): v is string {
  return typeof v === "string" && v in CATEGORY_LABEL;
}

export function formatPrice(price: number, negotiable: boolean): string {
  if (price <= 0) return negotiable ? "Nego" : "Gratis";
  const s = `Rp${price.toLocaleString("id-ID")}`;
  return negotiable ? `${s} (nego)` : s;
}
