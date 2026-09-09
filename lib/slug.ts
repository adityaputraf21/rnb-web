import slugify from "slugify";

export function slugBase(input: string, max = 60) {
  return (
    slugify(input, { lower: true, strict: true, trim: true }).slice(0, max) ||
    "item"
  );
}

export function threadSlug(title: string) {
  return `${slugBase(title)}-${Math.random().toString(36).slice(2, 8)}`;
}
