import { NextResponse } from "next/server";
import { apiWriter } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { threadSlug } from "@/lib/slug";
import { awardPoints, POINTS } from "@/lib/points";
import { notifyMentions } from "@/lib/notifications";
import { subscribe } from "@/lib/subscriptions";
import { checkAchievements } from "@/lib/achievements";
import { assertPostRate } from "@/lib/ratelimit";
import { getSiteConfig } from "@/lib/site-config";
import { sendDiscordWebhook, forumThreadEmbed } from "@/lib/discord";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let user;
  try {
    user = await apiWriter();
    await assertPostRate(user.id);
  } catch (res) {
    return res as Response;
  }

  const cfg = await getSiteConfig();
  if (cfg.maintenanceMode && user.role === "USER") {
    return NextResponse.json({ error: "situs sedang maintenance" }, { status: 503 });
  }

  const { categoryId, title, body } = await req.json().catch(() => ({}));
  if (
    typeof title !== "string" ||
    title.trim().length < 4 ||
    typeof body !== "string" ||
    body.trim().length < 2 ||
    !categoryId
  ) {
    return NextResponse.json(
      { error: "judul (min 4 karakter) dan isi wajib diisi" },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "kategori tidak ada" }, { status: 404 });
  }
  if (category.locked && user.role === "USER") {
    return NextResponse.json({ error: "kategori terkunci" }, { status: 403 });
  }

  const thread = await prisma.thread.create({
    data: {
      title: title.trim().slice(0, 160),
      slug: threadSlug(title),
      categoryId,
      authorId: user.id,
      lastPostAt: new Date(),
      posts: { create: { body: body.trim(), authorId: user.id } },
    },
  });

  await subscribe(user.id, thread.id);
  await awardPoints(user.id, POINTS.THREAD);
  await checkAchievements(user.id);

  const url = `/forum/${category.slug}/${thread.slug}`;
  await notifyMentions({
    body,
    actorId: user.id,
    actorName: user.name ?? user.username,
    url,
    context: title.trim(),
  });

  await sendDiscordWebhook({
    category: "forum",
    embed: forumThreadEmbed({
      id: thread.id,
      path: url,
      title: thread.title,
      authorName: user.name ?? user.username,
      categoryName: category.name,
      excerpt: body.trim().slice(0, 300),
    }),
  });

  return NextResponse.json({ url }, { status: 201 });
}
