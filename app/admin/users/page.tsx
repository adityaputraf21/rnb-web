import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireRole("MODERATOR", "/admin/users");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      role: true,
      points: true,
      tier: true,
      bannedAt: true,
      banReason: true,
    },
  });

  return (
    <UsersManager
      initial={users.map((u) => ({
        ...u,
        bannedAt: u.bannedAt?.toISOString() ?? null,
      }))}
      isAdmin={me.role === "ADMIN"}
      meId={me.id}
    />
  );
}
