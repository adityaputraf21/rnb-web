import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { ListingForm } from "@/components/market/listing-form";

export const metadata = { title: "Jual barang" };
export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireUser("/market/new");
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href="/market"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Pasar
      </Link>
      <h1 className="text-2xl font-bold">Jual barang</h1>
      <ListingForm />
    </div>
  );
}
