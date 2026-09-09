import { NextResponse } from "next/server";
import { apiRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { modLog } from "@/lib/mod-log";
import { sendDiscordWebhook } from "@/lib/discord";
import { toPlainExcerpt } from "@/lib/md-extract";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb.web";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const { title, body, excerpt, coverImage, published } = await req
    .json()
    .catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof title === "string" && title.trim())
    data.title = title.trim().slice(0, 160);
  if (typeof body === "string" && body.trim()) data.body = body.trim();
  if (typeof excerpt === "string")
    data.excerpt = excerpt.trim().slice(0, 300) || null;
  if (typeof coverImage === "string")
    data.coverImage = /^https:\/\//.test(coverImage) ? coverImage : null;

  const wasPublished = existing.published;
  if (typeof published === "boolean") {
    data.published = published;
    if (published && !existing.publishedAt) data.publishedAt = new Date();
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });

  const updated = await prisma.article.update({ where: { id }, data });
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "article.update",
    targetType: "article",
    targetId: id,
    summary: `"${updated.title}"${data.published !== undefined ? ` (published: ${data.published})` : ""}`,
  });

  if (!wasPublished && updated.published) {
    await sendDiscordWebhook({
      category: "announcement",
      embed: {
        author: { name: "📝 Artikel Baru" },
        title: updated.title,
        url: `${SITE_URL}/blog/${updated.slug}`,
        description:
          updated.excerpt ?? toPlainExcerpt(updated.body, 300) ?? undefined,
        image: updated.coverImage ? { url: updated.coverImage } : undefined,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await apiRole("MODERATOR");
  } catch (res) {
    return res as Response;
  }
  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.article.delete({ where: { id } });
  await modLog({
    moderatorId: user.id,
    moderatorName: user.username,
    action: "article.delete",
    targetType: "article",
    targetId: id,
    summary: `"${existing.title}" dihapus`,
  });
  return NextResponse.json({ ok: true });
}
