import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { StatusCard } from "@/components/feed/status-card";
import { shapeStatus, statusInclude } from "@/lib/status-shape";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await prisma.status.findUnique({
    where: { id },
    include: { author: { select: { name: true, username: true } } },
  });
  return {
    title: s
      ? `Status oleh ${s.author?.name ?? s.author?.username ?? "?"}`
      : "Status",
  };
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const s = await prisma.status.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...statusInclude(user?.id),
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { username: true, name: true, image: true } },
        },
      },
    },
  });
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Link
        href="/feed"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke feed
      </Link>
      <StatusCard
        status={shapeStatus(s, user)}
        currentUsername={user?.username ?? null}
        canModerate={hasRole(user, "MODERATOR")}
        showComments
        comments={s.comments.map((c) => ({
          id: c.id,
          body: c.body,
          parentId: c.parentId,
          createdAt: c.createdAt.toISOString(),
          author: c.author,
        }))}
      />
    </div>
  );
}
