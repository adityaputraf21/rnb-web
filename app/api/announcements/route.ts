import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, announcementEmbed } from "@/lib/discord";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(items);
}

/**
 * Buat pengumuman baru dari web -> simpan DB -> notifikasi Discord.
 * body: { title: string, body: string, authorName?: string }
 */
export async function POST(req: Request) {
  const { title, body, authorName } = await req.json().catch(() => ({}));

  if (!title || !body) {
    return NextResponse.json(
      { error: "title & body wajib diisi" },
      { status: 400 },
    );
  }

  const announcement = await prisma.announcement.create({
    data: { title, body, authorName: authorName ?? null, source: "web" },
  });

  await sendDiscordWebhook({
    category: "announcement",
    embed: announcementEmbed({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      authorName: announcement.authorName ?? undefined,
    }),
  });

  return NextResponse.json(announcement, { status: 201 });
}
