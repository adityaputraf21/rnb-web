import { UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getOrCreateInvite } from "@/lib/invites";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteShare } from "@/components/invite-share";
import { InviteReminder } from "@/components/invite-reminder";
import { initials } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Undang teman" };
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default async function InvitePage() {
  const me = await requireUser("/invite");
  const invite = await getOrCreateInvite(me.id);
  const invitees = await prisma.user.findMany({
    where: { invitedById: me.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { username: true, name: true, image: true, createdAt: true },
  });

  const link = `${SITE_URL}/login?ref=${invite.code}`;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Undang teman</h1>
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Bagikan link ini. Setiap teman yang gabung lewat link kamu, kamu dapat{" "}
          <span className="font-medium text-foreground">+25 poin</span>.
        </p>
        <InviteShare link={link} code={invite.code} />
        <div className="flex gap-4 text-sm">
          <span>
            <span className="font-bold">{invitees.length}</span>{" "}
            <span className="text-muted-foreground">bergabung</span>
          </span>
          <span>
            <span className="font-bold">{invitees.length * 25}</span>{" "}
            <span className="text-muted-foreground">poin didapat</span>
          </span>
        </div>
      </Card>

      <InviteReminder scheduledFor={invite.scheduledFor} />

      <div className="space-y-2">
        <h2 className="font-semibold">Teman yang kamu undang</h2>
        {invitees.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada. Ayo sebar!</p>
        )}
        <Card className="divide-y">
          {invitees.map((u) => (
            <div key={u.username} className="flex items-center gap-3 p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.image ?? undefined} />
                <AvatarFallback>{initials(u.name ?? u.username)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm">
                {u.name ?? u.username}{" "}
                <span className="text-muted-foreground">@{u.username}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(u.createdAt)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
