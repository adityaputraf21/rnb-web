import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OnboardingFlow } from "@/components/onboarding-flow";

export const metadata = { title: "Mulai" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.onboarded) redirect("/feed");

  const suggestions = await prisma.user.findMany({
    where: { bannedAt: null, id: { not: me.id } },
    orderBy: { points: "desc" },
    take: 10,
    select: { username: true, name: true, image: true, bio: true },
  });

  return <OnboardingFlow suggestions={suggestions} />;
}
