import { Megaphone, Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { CreateAnnouncementDialog } from "@/components/create-announcement-dialog";
import { fullDate } from "@/lib/format";

export const metadata = { title: "Pengumuman" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
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
        {hasRole(user, "MODERATOR") && <CreateAnnouncementDialog />}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
      )}

      <div className="space-y-4">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {a.pinned && <Pin className="h-4 w-4 text-primary" />}
                {a.title}
                <Badge variant="secondary" className="ml-auto">
                  {a.source === "discord" ? "via Discord" : "web"}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {a.author?.name ?? a.authorName ?? "Tim"} · {fullDate(a.createdAt)}
              </p>
            </CardHeader>
            <CardContent>
              <Markdown>{a.body}</Markdown>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
