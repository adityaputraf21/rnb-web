import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      role: true,
      points: true,
      tier: true,
      bannedAt: true,
      bannedUntil: true,
      mutedUntil: true,
      banReason: true,
      createdAt: true,
    },
  });
  return NextResponse.json(
    users.map((u) => ({
      ...u,
      bannedAt: u.bannedAt?.toISOString() ?? null,
      bannedUntil: u.bannedUntil?.toISOString() ?? null,
      mutedUntil: u.mutedUntil?.toISOString() ?? null,
    })),
  );
}
