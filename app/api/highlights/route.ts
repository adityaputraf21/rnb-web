import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Simpan sebuah story ke Highlight (permanen di profil). */
export async function POST(req: Request) {
  let me;
  try {
    me = await apiUser();
  } catch (res) {
    return res as Response;
  }
  const { storyId } = await req.json().catch(() => ({}));
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story || story.authorId !== me.id)
    return NextResponse.json({ error: "bukan story kamu" }, { status: 403 });

  const count = await prisma.highlight.count({ where: { userId: me.id } });
  const h = await prisma.highlight.create({
    data: {
      userId: me.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      bgColor: story.bgColor,
      caption: story.caption,
      position: count,
    },
  });
  return NextResponse.json({ id: h.id }, { status: 201 });
}
