import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { WikiEditor } from "@/components/wiki/wiki-editor";

export const metadata = { title: "Halaman wiki baru" };
export const dynamic = "force-dynamic";

export default async function NewWikiPage() {
  await requireUser("/wiki/new");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Wiki
      </Link>
      <h1 className="text-2xl font-bold">Halaman baru</h1>
      <WikiEditor />
    </div>
  );
}
