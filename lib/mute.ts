import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Ambil daftar kata yang dibisukan user (lowercase, sudah dipisah). */
export const mutedKeywordsFor = cache(async (userId: string): Promise<string[]> => {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { mutedKeywords: true },
  });
  if (!u?.mutedKeywords) return [];
  return u.mutedKeywords
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
});

/** Klausa Prisma untuk menyembunyikan Status yang mengandung kata dibisukan. */
export function mutedStatusWhere(
  keywords: string[],
): Prisma.StatusWhereInput {
  if (keywords.length === 0) return {};
  return {
    NOT: {
      OR: keywords.flatMap((k) => [
        { body: { contains: k, mode: "insensitive" as const } },
        { repostOf: { body: { contains: k, mode: "insensitive" as const } } },
      ]),
    },
  };
}

/** True kalau teks mengandung salah satu kata dibisukan. */
export function textIsMuted(text: string, keywords: string[]): boolean {
  if (!text || keywords.length === 0) return false;
  const low = text.toLowerCase();
  return keywords.some((k) => low.includes(k));
}
