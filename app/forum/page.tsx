import Link from "next/link";
import { MessagesSquare, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Forum" };
export const dynamic = "force-dynamic";

export default async function ForumIndex() {
  const user = await getCurrentUser();

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { threads: { where: { deletedAt: null } } } },
      threads: {
        where: { deletedAt: null },
        orderBy: { lastPostAt: "desc" },
        take: 1,
        include: { author: { select: { username: true, name: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forum</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} kategori
          </p>
        </div>
        {hasRole(user, "ADMIN") && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/categories">
              <Plus /> Kelola kategori
            </Link>
          </Button>
        )}
      </div>

      {categories.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Belum ada kategori.{" "}
          {hasRole(user, "ADMIN") ? (
            <Link href="/admin/categories" className="text-primary underline">
              Buat kategori pertama
            </Link>
          ) : (
            "Tunggu admin membuat kategori."
          )}
        </Card>
      )}

      <div className="space-y-3">
        {categories.map((c) => {
          const last = c.threads[0];
          return (
            <Card key={c.id} className="flex items-center gap-4 p-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${c.color}22`, color: c.color }}
              >
                <MessagesSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/forum/${c.slug}`}
                  className="font-semibold hover:underline"
                >
                  {c.name}
                </Link>
                {c.description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
              </div>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <p>{c._count.threads} thread</p>
                {last && (
                  <p className="truncate">
                    {last.title.slice(0, 28)} · {timeAgo(last.lastPostAt)}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
