import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, eventEmbed } from "@/lib/discord";
import { firstImageUrl, toPlainExcerpt } from "@/lib/md-extract";

export const runtime = "nodejs";

export async function GET() {
  const { getCurrentUser } = await import("@/lib/auth-helpers");
  if (!(await getCurrentUser()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
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

  const { title, date, description, location } = await req
    .json()
    .catch(() => ({}));
  if (!title || !date) {
    return NextResponse.json(
      { error: "judul & tanggal wajib diisi" },
      { status: 400 },
    );
  }

  const parsed = new Date(date);
  const event = await prisma.event.create({
    data: {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      location: location ? String(location).trim() : null,
      startsAt: Number.isNaN(parsed.getTime()) ? null : parsed,
      dateLabel: String(date),
      authorId: user.id,
      createdByName: user.name ?? user.username,
      source: "web",
    },
  });

  await sendDiscordWebhook({
    category: "event",
    embed: eventEmbed({
      id: event.id,
      title: event.title,
      date: event.dateLabel,
      description: event.description
        ? toPlainExcerpt(event.description, 1500)
        : undefined,
      imageUrl: event.description
        ? firstImageUrl(event.description)
        : undefined,
    }),
  });

  return NextResponse.json(event, { status: 201 });
}
