import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/marketplace";
import { MyListingActions } from "@/components/market/my-listing-actions";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Iklan saya" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  sold: "Terjual",
  closed: "Ditutup",
};

export default async function MyListingsPage() {
  const me = await requireUser("/market/mine");
  const listings = await prisma.listing.findMany({
    where: { sellerId: me.id },
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/market"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Pasar
      </Link>
      <h1 className="text-2xl font-bold">Iklan saya</h1>

      {listings.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada iklan.</p>
      )}

      <Card className="divide-y">
        {listings.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {l.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.images[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/market/${l.slug}`}
                className="truncate font-medium hover:underline"
              >
                {l.title}
              </Link>
              <p className="text-sm text-primary">
                {formatPrice(l.price, l.negotiable)}
              </p>
              <p className="text-xs text-muted-foreground">
                {l.views} dilihat · {timeAgo(l.createdAt)}
              </p>
            </div>
            <Badge variant={l.status === "active" ? "secondary" : "outline"}>
              {STATUS_LABEL[l.status]}
            </Badge>
            <MyListingActions id={l.id} slug={l.slug} status={l.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}
