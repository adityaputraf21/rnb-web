import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const session = await requireUser("/settings");
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      username: true,
      bio: true,
      website: true,
      bannerColor: true,
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Pengaturan profil</h1>
      <SettingsForm
        initial={{
          name: user?.name ?? "",
          username: user?.username ?? "",
          bio: user?.bio ?? "",
          website: user?.website ?? "",
          bannerColor: user?.bannerColor ?? "",
        }}
      />
    </div>
  );
}
