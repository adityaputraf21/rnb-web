import Link from "next/link";
import { notFound } from "next/navigation";
import { Pin, Lock, Plus, MessageSquare, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo, compactNumber } from "@/lib/format";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const SORTS = {
  latest: { label: "Aktivitas terbaru", order: { lastPostAt: "desc" as const } },
  new: { label: "Terbaru dibuat", order: { createdAt: "desc" as const } },
  top: { label: "Terpopuler", order: { views: "desc" as const } },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = await prisma.category.findUnique({ where: { slug: category } });
  return { title: c ? c.name : "Kategori" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string; filter?: string }>;
}) {
  const { category: slug } = await params;
  const { sort = "latest", page = "1", filter } = await searchParams;
  const sortKey = (sort in SORTS ? sort : "latest") as keyof typeof SORTS;
  const pageNum = Math.max(1, Number(page) || 1);
  const solvedOnly = filter === "solved";
  const unsolvedOnly = filter === "unsolved";

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const user = await getCurrentUser();
  const where = {
    categoryId: category.id,
    deletedAt: null,
    ...(solvedOnly ? { bestPostId: { not: null } } : {}),
    ...(unsolvedOnly ? { bestPostId: null } : {}),
  };

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where,
      orderBy: [{ pinned: "desc" }, SORTS[sortKey].order],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { select: { username: true, name: true, image: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.thread.count({ where }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const canPost = !!user && (!category.locked || user.role !== "USER");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link href="/forum" className="hover:underline">
              Forum
            </Link>{" "}
            / {category.name}
          </p>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
        {canPost ? (
          <Button asChild>
            <Link href={`/forum/${category.slug}/new`}>
              <Plus /> Thread baru
            </Link>
          </Button>
        ) : user ? (
          category.locked && (
            <span className="text-xs text-muted-foreground">
              <Lock className="mr-1 inline h-3 w-3" />
              Kategori terkunci
            </span>
          )
        ) : (
          <Button variant="outline" asChild>
            <Link href={`/login?callbackUrl=/forum/${category.slug}`}>
              Masuk untuk posting
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {Object.entries(SORTS).map(([key, v]) => (
          <Button
            key={key}
            variant={sortKey === key ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link
              href={`/forum/${category.slug}?sort=${key}${filter ? `&filter=${filter}` : ""}`}
            >
              {v.label}
            </Link>
          </Button>
        ))}
        <span className="mx-1 w-px bg-border" />
        {[
          ["", "Semua"],
          ["solved", "Terjawab"],
          ["unsolved", "Belum terjawab"],
        ].map(([key, label]) => (
          <Button
            key={label}
            variant={(filter ?? "") === key ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link
              href={`/forum/${category.slug}?sort=${sortKey}${key ? `&filter=${key}` : ""}`}
            >
              {label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="divide-y rounded-xl border">
        {threads.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Belum ada thread di kategori ini.
          </p>
        )}
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/forum/${category.slug}/${t.slug}`}
            className="flex items-center gap-3 p-4 hover:bg-accent/50"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={t.author?.image ?? undefined} />
              <AvatarFallback>
                {initials(t.author?.name ?? t.author?.username)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-medium">
                {t.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                {t.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                {t.bestPostId && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                )}
                <span className="truncate">{t.title}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t.author?.name ?? t.author?.username ?? "?"} ·{" "}
                {timeAgo(t.lastPostAt)}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {Math.max(0, t._count.posts - 1)}
              </span>
              <span className="hidden sm:inline">
                {compactNumber(t.views)} dilihat
              </span>
            </div>
          </Link>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === pageNum ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link
                href={`/forum/${category.slug}?sort=${sortKey}&page=${p}${filter ? `&filter=${filter}` : ""}`}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
