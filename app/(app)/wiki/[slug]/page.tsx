import Link from "next/link";
import { notFound } from "next/navigation";
import { BookText, History, Pencil, Lock } from "lucide-react";
import { requireUser, hasRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { WikiLockToggle } from "@/components/wiki/wiki-lock-toggle";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await prisma.wikiPage.findUnique({ where: { slug } });
  return { title: p ? `${p.title} — Wiki` : "Wiki" };
}

export default async function WikiPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await requireUser(`/wiki/${slug}`);
  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      updatedBy: { select: { username: true, name: true } },
      _count: { select: { revisions: true } },
    },
  });
  if (!page) notFound();

  const canEdit = !page.locked || hasRole(me, "MODERATOR");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <BookText className="h-4 w-4" /> Semua halaman
      </Link>

      <div className="flex items-start justify-between gap-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          {page.locked && <Lock className="h-5 w-5 text-muted-foreground" />}
          {page.title}
        </h1>
        <div className="flex shrink-0 gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/wiki/${slug}/history`}>
              <History className="h-4 w-4" /> {page._count.revisions}
            </Link>
          </Button>
          {canEdit && (
            <Button size="sm" asChild>
              <Link href={`/wiki/${slug}/edit`}>
                <Pencil className="h-4 w-4" /> Sunting
              </Link>
            </Button>
          )}
          {hasRole(me, "MODERATOR") && (
            <WikiLockToggle slug={slug} locked={page.locked} />
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Diperbarui {timeAgo(page.updatedAt)}
        {page.updatedBy && ` oleh @${page.updatedBy.username}`}
      </p>

      {page.body.trim() ? (
        <Markdown className="prose-sm sm:prose-base">{page.body}</Markdown>
      ) : (
        <p className="text-sm text-muted-foreground">
          Halaman ini masih kosong.{" "}
          {canEdit && (
            <Link href={`/wiki/${slug}/edit`} className="text-primary underline">
              Tulis sesuatu
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
