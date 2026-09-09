import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: { username: { startsWith: q }, bannedAt: null },
    select: { username: true, name: true, image: true },
    take: 6,
    orderBy: { points: "desc" },
  });
  return NextResponse.json(users);
}
