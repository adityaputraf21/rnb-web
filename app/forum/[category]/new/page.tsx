import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { NewThreadForm } from "@/components/forum/new-thread-form";

export const metadata = { title: "Thread baru" };

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const user = await requireUser(`/forum/${slug}/new`);
  if (category.locked && user.role === "USER") notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">{category.name}</p>
        <h1 className="text-2xl font-bold">Buat thread baru</h1>
      </div>
      <NewThreadForm categoryId={category.id} categorySlug={category.slug} />
    </div>
  );
}
