import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook, eventEmbed } from "@/lib/discord";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(items);
}

/**
 * body: { title: string, date: string, description?: string, createdByName?: string }
 */
export async function POST(req: Request) {
  const { title, date, description, createdByName } = await req
    .json()
    .catch(() => ({}));

  if (!title || !date) {
    return NextResponse.json(
      { error: "title & date wajib diisi" },
      { status: 400 },
    );
  }

  const parsed = new Date(date);
  const event = await prisma.event.create({
    data: {
      title,
      description: description ?? null,
      startsAt: Number.isNaN(parsed.getTime()) ? null : parsed,
      dateLabel: String(date),
      createdByName: createdByName ?? null,
      source: "web",
    },
  });

  await sendDiscordWebhook({
    category: "event",
    embed: eventEmbed({
      id: event.id,
      title: event.title,
      date: event.dateLabel,
      description: event.description ?? undefined,
    }),
  });

  return NextResponse.json(event, { status: 201 });
}
