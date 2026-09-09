import Link from "next/link";
import { BookText, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Wiki" };
export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  await requireUser("/wiki");
  const pages = await prisma.wikiPage.findMany({
    orderBy: { title: "asc" },
    include: { updatedBy: { select: { username: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Wiki</h1>
        </div>
        <Button size="sm" asChild>
          <Link href="/wiki/new">
            <Plus /> Halaman baru
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Basis pengetahuan komunitas. Siapa saja bisa menyunting; semua perubahan
        tercatat.
      </p>

      {pages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada halaman. Buat yang pertama!
        </p>
      )}

      <Card className="divide-y">
        {pages.map((p) => (
          <Link
            key={p.slug}
            href={`/wiki/${p.slug}`}
            className="block p-3 hover:bg-accent/50"
          >
            <p className="font-medium">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              Diperbarui {timeAgo(p.updatedAt)}
              {p.updatedBy && ` oleh @${p.updatedBy.username}`}
            </p>
          </Link>
        ))}
      </Card>
    </div>
  );
}
