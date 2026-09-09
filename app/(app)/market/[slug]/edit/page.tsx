import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/market/listing-form";

export const metadata = { title: "Sunting iklan" };
export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await requireUser(`/market/${slug}/edit`);
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!listing) notFound();
  if (listing.sellerId !== me.id && !hasRole(me, "MODERATOR"))
    redirect(`/market/${slug}`);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href={`/market/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="text-2xl font-bold">Sunting iklan</h1>
      <ListingForm
        initial={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          negotiable: listing.negotiable,
          category: listing.category,
          condition: listing.condition,
          location: listing.location ?? "",
          images: listing.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
