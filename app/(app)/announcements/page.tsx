import { Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { CreateAnnouncementDialog } from "@/components/create-announcement-dialog";
import { AnnouncementItem } from "@/components/announcement-item";
import { fullDate } from "@/lib/format";

export const metadata = { title: "Pengumuman" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  const canManage = hasRole(user, "MODERATOR");
  const items = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { author: { select: { username: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pengumuman</h1>
        </div>
        {canManage && <CreateAnnouncementDialog />}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
      )}

      <div className="space-y-4">
        {items.map((a) => (
          <AnnouncementItem
            key={a.id}
            canManage={canManage}
            a={{
              id: a.id,
              title: a.title,
              body: a.body,
              pinned: a.pinned,
              source: a.source,
              authorName: a.author?.name ?? a.authorName,
              createdLabel: fullDate(a.createdAt),
            }}
          />
        ))}
      </div>
    </div>
  );
}
