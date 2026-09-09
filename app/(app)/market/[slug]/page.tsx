import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageSquare } from "lucide-react";
import { requireUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportButton } from "@/components/forum/report-button";
import { ListingGallery } from "@/components/market/listing-gallery";
import { CATEGORY_LABEL, formatPrice } from "@/lib/marketplace";
import { initials } from "@/lib/utils";
import { fullDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const l = await prisma.listing.findUnique({ where: { slug } });
  return { title: l?.title ?? "Iklan" };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await requireUser(`/market/${slug}`);

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      seller: {
        select: { username: true, name: true, image: true, tier: true },
      },
    },
  });
  if (!listing) notFound();

  const mine = listing.sellerId === me.id;
  if (!mine)
    prisma.listing
      .update({ where: { id: listing.id }, data: { views: { increment: 1 } } })
      .catch(() => {});

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/market"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Pasar
      </Link>

      <ListingGallery images={listing.images.map((i) => i.url)} />

      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          {listing.status !== "active" && (
            <Badge variant="outline">
              {listing.status === "sold" ? "Terjual" : "Ditutup"}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xl font-bold text-primary">
          {formatPrice(listing.price, listing.negotiable)}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{CATEGORY_LABEL[listing.category]}</span>
          <span>{listing.condition === "new" ? "Baru" : "Bekas"}</span>
          {listing.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {listing.location}
            </span>
          )}
          <span>{fullDate(listing.createdAt)}</span>
        </p>
      </div>

      <p className="whitespace-pre-wrap text-sm">{listing.description}</p>

      <div className="flex items-center gap-3 rounded-xl border p-3">
        <Avatar>
          <AvatarImage src={listing.seller?.image ?? undefined} />
          <AvatarFallback>
            {initials(listing.seller?.name ?? listing.seller?.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Link
            href={`/u/${listing.seller?.username}`}
            className="font-medium hover:underline"
          >
            {listing.seller?.name ?? listing.seller?.username ?? "Penjual"}
          </Link>
          <p className="text-xs text-muted-foreground">
            {listing.seller?.tier}
          </p>
        </div>
        {mine ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/market/${listing.slug}/edit`}>Sunting</Link>
          </Button>
        ) : (
          listing.seller && (
            <Button size="sm" asChild>
              <Link href={`/messages/${listing.seller.username}`}>
                <MessageSquare /> Hubungi
              </Link>
            </Button>
          )
        )}
      </div>

      {!mine && (
        <ReportButton targetType="listing" targetId={listing.id} />
      )}
      {hasRole(me, "MODERATOR") && !mine && (
        <p className="text-xs text-muted-foreground">
          Moderator: kamu bisa menghapus iklan ini dari menu penjual.
        </p>
      )}
    </div>
  );
}
