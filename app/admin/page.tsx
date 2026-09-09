import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [users, banned, threads, posts, cats, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { bannedAt: { not: null } } }),
    prisma.thread.count({ where: { deletedAt: null } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.category.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { moderator: { select: { username: true } } },
    }),
  ]);

  const stats = [
    ["Pengguna", users],
    ["Diblokir", banned],
    ["Thread", threads],
    ["Post", posts],
    ["Kategori", cats],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([l, v]) => (
          <Card key={l}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{v}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Aktivitas moderasi terbaru</h2>
          <Link href="/admin/audit" className="text-sm text-primary">
            Semua
          </Link>
        </div>
        <Card className="divide-y">
          {recent.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada.</p>
          )}
          {recent.map((a) => (
            <div key={a.id} className="p-3 text-sm">
              <span className="font-medium">
                {a.moderator?.username ?? "sistem"}
              </span>{" "}
              <span className="text-muted-foreground">
                {a.action} · {a.targetType} · {timeAgo(a.createdAt)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
