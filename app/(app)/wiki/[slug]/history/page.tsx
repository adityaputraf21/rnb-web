import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { WikiRevertButton } from "@/components/wiki/wiki-revert-button";
import { fullDate } from "@/lib/format";

export const metadata = { title: "Riwayat wiki" };
export const dynamic = "force-dynamic";

export default async function WikiHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await requireUser(`/wiki/${slug}/history`);
  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { editor: { select: { username: true } } },
      },
    },
  });
  if (!page) notFound();

  const canRevert = !page.locked || hasRole(me, "MODERATOR");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/wiki/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {page.title}
      </Link>
      <h1 className="text-2xl font-bold">Riwayat: {page.title}</h1>

      <Card className="divide-y">
        {page.revisions.map((r, i) => (
          <div key={r.id} className="p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {fullDate(r.createdAt)}
                  {i === 0 && (
                    <span className="ml-2 text-xs text-primary">versi saat ini</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.editor ? `@${r.editor.username}` : "sistem"}
                  {r.summary && ` — ${r.summary}`}
                </p>
              </div>
              {i !== 0 && canRevert && (
                <WikiRevertButton slug={slug} revisionId={r.id} />
              )}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Lihat isi versi ini
              </summary>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                {r.body || "(kosong)"}
              </pre>
            </details>
          </div>
        ))}
      </Card>
    </div>
  );
}
