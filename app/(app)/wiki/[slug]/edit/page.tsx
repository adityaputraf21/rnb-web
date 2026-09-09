import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { WikiEditor } from "@/components/wiki/wiki-editor";

export const metadata = { title: "Sunting wiki" };
export const dynamic = "force-dynamic";

export default async function EditWikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await requireUser(`/wiki/${slug}/edit`);
  const page = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!page) notFound();
  if (page.locked && !hasRole(me, "MODERATOR")) redirect(`/wiki/${slug}`);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/wiki/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {page.title}
      </Link>
      <h1 className="text-2xl font-bold">Sunting: {page.title}</h1>
      <WikiEditor
        slug={slug}
        initialTitle={page.title}
        initialBody={page.body}
      />
    </div>
  );
}
