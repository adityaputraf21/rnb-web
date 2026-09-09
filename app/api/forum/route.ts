import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, forumThreadEmbed } from "@/lib/discord";

export const runtime = "nodejs";

/**
 * body: { title, body, authorName, categoryName? }
 */
export async function POST(req: Request) {
  const { title, body, authorName, categoryName } = await req
    .json()
    .catch(() => ({}));

  if (!title || !body || !authorName) {
    return NextResponse.json(
      { error: "title, body, authorName wajib diisi" },
      { status: 400 },
    );
  }

  const thread = await prisma.forumThread.create({
    data: {
      title,
      body,
      authorName,
      categoryName: categoryName ?? null,
    },
  });

  await sendDiscordWebhook({
    category: "forum",
    embed: forumThreadEmbed({
      id: thread.id,
      title: thread.title,
      authorName: thread.authorName,
      categoryName: thread.categoryName ?? undefined,
      excerpt: thread.body.slice(0, 300),
    }),
  });

  return NextResponse.json(thread, { status: 201 });
}
