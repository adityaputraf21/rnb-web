import Link from "next/link";
import { Store, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { blockedIdsFor } from "@/lib/blocks";
import { Button } from "@/components/ui/button";
import { LISTING_CATEGORIES, CATEGORY_LABEL, formatPrice } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Pasar" };
export const dynamic = "force-dynamic";

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const me = await requireUser("/market");
  const { category, q } = await searchParams;
  const hidden = await blockedIdsFor(me.id);

  const listings = await prisma.listing.findMany({
    where: {
      status: "active",
      ...(hidden.size ? { sellerId: { notIn: [...hidden] } } : {}),
      ...(category && category in CATEGORY_LABEL ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      seller: { select: { username: true, name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pasar</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/market/mine">Iklan saya</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/market/new">
              <Plus /> Jual barang
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex gap-2" action="/market">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari barang…"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <Button type="submit" size="sm">
          Cari
        </Button>
      </form>

      <div className="flex flex-wrap gap-1">
        <Link
          href="/market"
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            !category ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent",
          )}
        >
          Semua
        </Link>
        {LISTING_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/market?category=${c.slug}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              category === c.slug
                ? "border-primary bg-primary/10 font-medium"
                : "hover:bg-accent",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada iklan di sini.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/market/${l.slug}`}
            className="overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/40"
          >
            <div className="aspect-square bg-muted">
              {l.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.images[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Store className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-sm font-medium">{l.title}</p>
              <p className="text-sm font-semibold text-primary">
                {formatPrice(l.price, l.negotiable)}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {CATEGORY_LABEL[l.category]} · {timeAgo(l.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
