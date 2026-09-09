import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, announcementEmbed } from "@/lib/discord";
import { firstImageUrl, toPlainExcerpt } from "@/lib/md-extract";

export const runtime = "nodejs";

export async function GET() {
  const { getCurrentUser } = await import("@/lib/auth-helpers");
  if (!(await getCurrentUser()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { author: { select: { username: true, name: true } } },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }

  const { title, body, pinned } = await req.json().catch(() => ({}));
  if (!title || !body) {
    return NextResponse.json(
      { error: "judul & isi wajib diisi" },
      { status: 400 },
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: String(title).trim(),
      body: String(body).trim(),
      authorId: user.id,
      authorName: user.name ?? user.username,
      pinned: !!pinned,
      source: "web",
    },
  });

  await sendDiscordWebhook({
    category: "announcement",
    embed: announcementEmbed({
      id: announcement.id,
      title: announcement.title,
      body: toPlainExcerpt(announcement.body, 1500),
      authorName: announcement.authorName ?? undefined,
      imageUrl: firstImageUrl(announcement.body),
    }),
  });

  return NextResponse.json(announcement, { status: 201 });
}
