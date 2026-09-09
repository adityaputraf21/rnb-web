import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { BlogManager } from "@/components/blog/blog-manager";

export const metadata = { title: "Kelola blog" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  await requireRole("MODERATOR", "/admin/blog");

  const articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <BlogManager
      initial={articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        body: a.body,
        coverImage: a.coverImage,
        published: a.published,
      }))}
    />
  );
}
