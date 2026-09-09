import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ReportsQueue } from "@/components/admin/reports-queue";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireRole("MODERATOR", "/admin/reports");

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { reporter: { select: { username: true } } },
  });

  // Ambil preview + url target
  const enriched = await Promise.all(
    reports.map(async (r) => {
      let targetUrl: string | null = null;
      let targetPreview: string | null = null;
      if (r.targetType === "post") {
        const p = await prisma.post.findUnique({
          where: { id: r.targetId },
          include: { thread: { include: { category: true } } },
        });
        if (p) {
          targetPreview = p.body.slice(0, 240);
          targetUrl = `/forum/${p.thread.category.slug}/${p.thread.slug}#post-${p.id}`;
        }
      } else if (r.targetType === "status") {
        const s = await prisma.status.findUnique({ where: { id: r.targetId } });
        if (s) {
          targetPreview = s.body.slice(0, 240) || "(status berisi gambar)";
          targetUrl = `/feed/${s.id}`;
        }
      } else {
        const t = await prisma.thread.findUnique({
          where: { id: r.targetId },
          include: { category: true },
        });
        if (t) {
          targetPreview = t.title;
          targetUrl = `/forum/${t.category.slug}/${t.slug}`;
        }
      }
      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter,
        targetUrl,
        targetPreview,
      };
    }),
  );

  return <ReportsQueue initial={enriched} />;
}
