import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { fullDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await prisma.article.findUnique({ where: { slug } });
  return { title: a?.title ?? "Artikel" };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, cfg] = await Promise.all([getCurrentUser(), getSiteConfig()]);
  if (!cfg.blogEnabled) notFound();
  const canManage = hasRole(user, "MODERATOR");

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: { select: { username: true, name: true, image: true } } },
  });
  if (!article || (!article.published && !canManage)) notFound();

  prisma.article
    .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Semua artikel
      </Link>

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt=""
          className="max-h-80 w-full rounded-2xl object-cover"
        />
      )}

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{article.title}</h1>
          {!article.published && <Badge variant="secondary">Draf</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {article.author?.name ?? article.author?.username ?? "Tim RnB"} ·{" "}
          {article.publishedAt
            ? fullDate(article.publishedAt)
            : fullDate(article.createdAt)}
          {" · "}
          {article.views + 1} dibaca
        </p>
      </div>

      <Markdown className="prose-sm sm:prose-base">{article.body}</Markdown>

      {canManage && (
        <p className="pt-4 text-sm">
          <Link href="/admin/blog" className="text-primary hover:underline">
            Sunting di panel
          </Link>
        </p>
      )}
    </article>
  );
}
