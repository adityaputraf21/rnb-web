import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MiniBars } from "@/components/admin/mini-bars";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

function bucketByDay(dates: Date[]) {
  const days: { day: string; count: number }[] = [];
  const map = new Map<string, number>();
  for (const d of dates) {
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ day: d, count: map.get(d) ?? 0 });
  }
  return days;
}

export default async function AdminOverview() {
  const since = new Date(Date.now() - 30 * 86400000);
  const now = Date.now();
  const [
    users,
    banned,
    threads,
    posts,
    cats,
    openReports,
    online,
    dau,
    wau,
    mau,
    newUsers,
    newPosts,
    recent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { bannedAt: { not: null } } }),
    prisma.thread.count({ where: { deletedAt: null } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.category.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count({
      where: { lastSeenAt: { gte: new Date(now - 5 * 60000) } },
    }),
    prisma.user.count({
      where: { lastSeenAt: { gte: new Date(now - 86400000) } },
    }),
    prisma.user.count({
      where: { lastSeenAt: { gte: new Date(now - 7 * 86400000) } },
    }),
    prisma.user.count({
      where: { lastSeenAt: { gte: new Date(now - 30 * 86400000) } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      select: { createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { moderator: { select: { username: true } } },
    }),
  ]);

  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0;

  const stats = [
    ["Pengguna", users],
    ["Online", online],
    ["DAU", dau],
    ["WAU", wau],
    ["MAU", mau],
    ["Stickiness", `${stickiness}%`],
    ["Diblokir", banned],
    ["Thread", threads],
    ["Post", posts],
    ["Laporan", openReports],
    ["Kategori", cats],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map(([l, v]) => (
          <Card key={l}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{v}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <MiniBars
              label="Pendaftaran"
              data={bucketByDay(newUsers.map((u) => u.createdAt))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <MiniBars
              label="Postingan"
              data={bucketByDay(newPosts.map((p) => p.createdAt))}
            />
          </CardContent>
        </Card>
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
