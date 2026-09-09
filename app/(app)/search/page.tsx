import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return { title: q ? `Cari: ${q}` : "Pencarian" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  const [threads, posts] =
    term.length >= 2
      ? await Promise.all([
          prisma.thread.findMany({
            where: {
              deletedAt: null,
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                {
                  posts: {
                    some: {
                      body: { contains: term, mode: "insensitive" },
                      deletedAt: null,
                    },
                  },
                },
              ],
            },
            orderBy: { lastPostAt: "desc" },
            take: 20,
            include: {
              category: true,
              author: { select: { username: true, name: true } },
              _count: { select: { posts: true } },
            },
          }),
          prisma.post.findMany({
            where: {
              deletedAt: null,
              body: { contains: term, mode: "insensitive" },
              thread: { deletedAt: null },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              author: { select: { username: true, name: true } },
              thread: { include: { category: true } },
            },
          }),
        ])
      : [[], []];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={term}
          placeholder="Kata kunci…"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoFocus
        />
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          <SearchIcon className="h-4 w-4" /> Cari
        </button>
      </form>

      {term.length < 2 ? (
        <p className="text-sm text-muted-foreground">Ketik minimal 2 karakter.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {threads.length} thread, {posts.length} balasan cocok dengan
            &quot;{term}&quot;
          </p>

          {threads.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold">Thread</h2>
              <Card className="divide-y">
                {threads.map((t) => (
                  <Link
                    key={t.id}
                    href={`/forum/${t.category.slug}/${t.slug}`}
                    className="block p-3 hover:bg-accent/50"
                  >
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category.name} ·{" "}
                      {t.author?.name ?? t.author?.username ?? "?"} ·{" "}
                      {t._count.posts} pos
                    </p>
                  </Link>
                ))}
              </Card>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold">Balasan</h2>
              <Card className="divide-y">
                {posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/forum/${p.thread.category.slug}/${p.thread.slug}#post-${p.id}`}
                    className="block p-3 hover:bg-accent/50"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{p.thread.title}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {p.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.author?.name ?? p.author?.username ?? "?"}
                    </p>
                  </Link>
                ))}
              </Card>
            </div>
          )}

          {threads.length === 0 && posts.length === 0 && (
            <p className="text-sm text-muted-foreground">Tidak ada hasil.</p>
          )}
        </>
      )}
    </div>
  );
}
