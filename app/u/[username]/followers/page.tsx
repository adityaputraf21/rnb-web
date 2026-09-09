import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { UserList } from "@/components/user-list";

export const dynamic = "force-dynamic";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, name: true },
  });
  if (!user) notFound();

  const rows = await prisma.follow.findMany({
    where: { followingId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      follower: {
        select: {
          username: true,
          name: true,
          image: true,
          role: true,
          tier: true,
          bio: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href={`/u/${user.username}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {user.name ?? user.username}
      </Link>
      <h1 className="text-xl font-bold">Pengikut</h1>
      <UserList users={rows.map((r) => r.follower)} />
    </div>
  );
}
