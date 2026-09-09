import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifikasi" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

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
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-muted-foreground">{n.body}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(n.createdAt)}
              </p>
            </div>
          );
          return n.url ? (
            <Link key={n.id} href={n.url}>
              {inner}
            </Link>
          ) : (
            <div key={n.id}>{inner}</div>
          );
        })}
      </Card>
    </div>
  );
}
