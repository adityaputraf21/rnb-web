import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const sel = { username: true, name: true, image: true } as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const type = new URL(req.url).searchParams.get("type") ?? "like";

  if (type === "repost") {
    const rows = await prisma.status.findMany({
      where: { repostOfId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { author: { select: sel }, body: true, id: true },
    });
    return NextResponse.json(
      rows
        .filter((r) => r.author)
        .map((r) => ({ ...r.author!, quote: r.body || null, statusId: r.id })),
    );
  }

  const rows = await prisma.statusLike.findMany({
    where: { statusId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { user: { select: sel } },
  });
  return NextResponse.json(rows.map((r) => r.user));
}
