import Link from "next/link";
import { notFound } from "next/navigation";
import { Newspaper, Plus } from "lucide-react";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fullDate } from "@/lib/format";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [user, cfg] = await Promise.all([getCurrentUser(), getSiteConfig()]);
  if (!cfg.blogEnabled) notFound();
  const canManage = hasRole(user, "MODERATOR");

  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { author: { select: { username: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Blog</h1>
        </div>
        {canManage && (
          <Button asChild size="sm">
            <Link href="/admin/blog">
              <Plus /> Kelola
            </Link>
          </Button>
        )}
      </div>

      {articles.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada artikel.</p>
      )}

      <div className="space-y-4">
        {articles.map((a) => (
          <Link key={a.id} href={`/blog/${a.slug}`} className="block">
            <Card className="overflow-hidden transition-colors hover:bg-accent/40">
              {a.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.coverImage}
                  alt=""
                  className="h-44 w-full object-cover"
                />
              )}
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{a.title}</h2>
                {a.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {a.excerpt}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.author?.name ?? a.author?.username ?? "Tim RnB"} ·{" "}
                  {a.publishedAt ? fullDate(a.publishedAt) : "draf"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
