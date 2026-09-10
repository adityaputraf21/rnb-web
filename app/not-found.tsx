import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted-foreground">
        Mungkin sudah dihapus atau tautannya salah.
      </p>
      <Button asChild>
        <Link href="/feed">Kembali ke Feed</Link>
      </Button>
    </div>
  );
}
