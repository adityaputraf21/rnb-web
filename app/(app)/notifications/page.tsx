import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { groupNotifications } from "@/lib/notif-group";

export const metadata = { title: "Notifikasi" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");

  const raw = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const items = groupNotifications(
    raw.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url,
      read: n.read,
      createdAt: n.createdAt,
    })),
  );

  // tandai semua terbaca saat halaman dibuka
  await prisma.notification
    .updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })
    .catch(() => {});

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Notifikasi</h1>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
      )}

      <Card className="divide-y">
        {items.map((n) => {
          const inner = (
            <div
              className={cn(
                "p-3 text-sm hover:bg-accent/50",
                !n.read && "bg-primary/5",
              )}
            >
              <p className="font-medium">
                {n.title}
                {n.count > 1 && (
                  <span className="ml-1 text-muted-foreground">
                    +{n.count - 1} lainnya
                  </span>
                )}
              </p>
              {n.body && n.count === 1 && (
                <p className="text-muted-foreground">{n.body}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(n.createdAt)}
              </p>
            </div>
          );
          const key = n.ids[0];
          return n.url ? (
            <Link key={key} href={n.url}>
              {inner}
            </Link>
          ) : (
            <div key={key}>{inner}</div>
          );
        })}
      </Card>
    </div>
  );
}
