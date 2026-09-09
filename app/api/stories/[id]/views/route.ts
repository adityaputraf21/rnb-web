import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Daftar penonton sebuah story — hanya pemilik. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (story.authorId !== me.id && me.role === "USER")
    return NextResponse.json({ error: "khusus pemilik" }, { status: 403 });

  const views = await prisma.storyView.findMany({
    where: { storyId: id },
    orderBy: { createdAt: "desc" },
    include: {
      viewer: { select: { username: true, name: true, image: true } },
    },
  });

  return NextResponse.json(
    views.map((v) => ({
      username: v.viewer.username,
      name: v.viewer.name,
      image: v.viewer.image,
      at: v.createdAt.toISOString(),
    })),
  );
}
