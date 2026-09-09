import { NextResponse } from "next/server";
import { apiRole, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { slugBase } from "@/lib/slug";
import { sendDiscordWebhook } from "@/lib/discord";
import { toPlainExcerpt, firstImageUrl } from "@/lib/md-extract";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb.web";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const all = new URL(req.url).searchParams.get("all") === "1";
  const canManage = me.role === "MODERATOR" || me.role === "ADMIN" || me.role === "OWNER";

  const items = await prisma.article.findMany({
    where: all && canManage ? {} : { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
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

  const { title, body, excerpt, coverImage, published } = await req
    .json()
    .catch(() => ({}));
  if (!title?.trim() || !body?.trim())
    return NextResponse.json(
      { error: "judul & isi wajib diisi" },
      { status: 400 },
    );

  let slug = slugBase(title);
  if (await prisma.article.findUnique({ where: { slug } }))
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const isPub = !!published;
  const article = await prisma.article.create({
    data: {
      slug,
      title: String(title).trim().slice(0, 160),
      body: String(body).trim(),
      excerpt: excerpt ? String(excerpt).trim().slice(0, 300) : null,
      coverImage:
        typeof coverImage === "string" && /^https:\/\//.test(coverImage)
          ? coverImage
          : null,
      published: isPub,
      publishedAt: isPub ? new Date() : null,
      authorId: user.id,
    },
  });

  if (isPub) {
    await sendDiscordWebhook({
      category: "announcement",
      embed: {
        author: { name: "📝 Artikel Baru" },
        title: article.title,
        url: `${SITE_URL}/blog/${article.slug}`,
        description:
          article.excerpt ?? toPlainExcerpt(article.body, 300) ?? undefined,
        image: firstImageUrl(article.body)
          ? { url: firstImageUrl(article.body)! }
          : article.coverImage
            ? { url: article.coverImage }
            : undefined,
      },
    });
  }

  return NextResponse.json(article, { status: 201 });
}
