import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN", "/admin/categories");
  const cats = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { threads: true } } },
  });
  return <CategoriesManager initial={cats} />;
}
