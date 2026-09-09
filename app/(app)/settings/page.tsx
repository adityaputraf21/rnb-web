import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";
import { NotificationPrefs } from "@/components/notification-prefs";
import { BlockedUsers } from "@/components/blocked-users";
import { PushToggle } from "@/components/push-toggle";

export const metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUser("/settings");
  const [user, blocks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        name: true,
        username: true,
        bio: true,
        website: true,
        bannerColor: true,
        bannerImage: true,
        image: true,
        mutedKeywords: true,
        notifyMention: true,
        notifyReply: true,
        notifyReaction: true,
        notifyFollow: true,
      },
    }),
    prisma.block.findMany({
      where: { blockerId: session.id },
      include: { blocked: { select: { username: true, name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <SettingsForm
        initial={{
          name: user?.name ?? "",
          username: user?.username ?? "",
          bio: user?.bio ?? "",
          website: user?.website ?? "",
          bannerColor: user?.bannerColor ?? "",
          bannerImage: user?.bannerImage ?? "",
          image: user?.image ?? "",
          mutedKeywords: user?.mutedKeywords ?? "",
        }}
      />
      <PushToggle />
      <NotificationPrefs
        initial={{
          notifyMention: user?.notifyMention ?? true,
          notifyReply: user?.notifyReply ?? true,
          notifyReaction: user?.notifyReaction ?? true,
          notifyFollow: user?.notifyFollow ?? true,
        }}
      />
      <BlockedUsers initial={blocks.map((b) => b.blocked)} />
    </div>
  );
}
