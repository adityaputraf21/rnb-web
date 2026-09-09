import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiUser();
  } catch (res) {
    return res as Response;
  }

  const { targetType, targetId, reason } = await req.json().catch(() => ({}));
  if (
    !["post", "thread", "status"].includes(targetType) ||
    !targetId ||
    typeof reason !== "string" ||
    reason.trim().length < 3
  ) {
    return NextResponse.json({ error: "data laporan tidak lengkap" }, { status: 400 });
  }

  const dupe = await prisma.report.findFirst({
    where: { reporterId: user.id, targetType, targetId, status: "OPEN" },
  });
  if (dupe) {
    return NextResponse.json({ error: "kamu sudah melaporkan ini" }, { status: 409 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId,
      reason: reason.trim().slice(0, 500),
    },
  });

  await sendDiscordWebhook({
    category: "modlog",
    embed: {
      author: { name: "🚩 Laporan baru" },
      description: reason.trim().slice(0, 400),
      fields: [
        { name: "Pelapor", value: user.username, inline: true },
        { name: "Target", value: `${targetType} \`${targetId}\``, inline: true },
      ],
    },
  });

  return NextResponse.json({ id: report.id }, { status: 201 });
}
