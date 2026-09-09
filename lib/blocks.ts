import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Set id user yang harus disembunyikan dari `userId` (yang dia blokir + yang memblokir dia). */
export const blockedIdsFor = cache(async (userId: string): Promise<Set<string>> => {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  }
  return ids;
});
