import Link from "next/link";
import { Hash } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { shapeStatus, statusInclude } from "@/lib/status-shape";
import { StatusCard } from "@/components/feed/status-card";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return { title: `#${tag}` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: raw } = await params;
  const tag = raw.toLowerCase();
  const user = await getCurrentUser();
  const q = `#${tag}`;

  const [statuses, threads] = await Promise.all([
    prisma.status.findMany({
      where: { deletedAt: null, body: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: statusInclude(user?.id),
    }),
    prisma.thread.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { posts: { some: { body: { contains: q, mode: "insensitive" } } } },
        ],
      },
      orderBy: { lastPostAt: "desc" },
      take: 10,
      include: { category: true, _count: { select: { posts: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Hash className="h-6 w-6 text-primary" />
        {tag}
      </h1>

      {threads.length > 0 && (
        <Card className="divide-y">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/forum/${t.category.slug}/${t.slug}`}
              className="block p-3 hover:bg-accent/50"
            >
              <p className="font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.category.name} · {t._count.posts} pos · {timeAgo(t.lastPostAt)}
              </p>
            </Link>
          ))}
        </Card>
      )}

      {statuses.length === 0 && threads.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada konten dengan tag ini.
        </p>
      )}

      <div className="space-y-3">
        {statuses.map((st) => (
          <StatusCard
            key={st.id}
            status={shapeStatus(st, user)}
            currentUsername={user?.username ?? null}
            canModerate={false}
          />
        ))}
      </div>
    </div>
  );
}
