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
      } else if (r.targetType === "listing") {
        const l = await prisma.listing.findUnique({ where: { id: r.targetId } });
        if (l) {
          targetPreview = `${l.title} — ${l.description.slice(0, 200)}`;
          targetUrl = `/market/${l.slug}`;
        }
      } else if (r.targetType === "wiki") {
        const w = await prisma.wikiPage.findUnique({ where: { id: r.targetId } });
        if (w) {
          targetPreview = `${w.title} — ${w.body.slice(0, 200)}`;
          targetUrl = `/wiki/${w.slug}`;
        }
      } else if (r.targetType === "story") {
        const s = await prisma.story.findUnique({
          where: { id: r.targetId },
          include: { author: { select: { username: true } } },
        });
        if (s) {
          targetPreview = `Story @${s.author?.username ?? "?"} — ${s.caption ?? s.mediaType}`;
          targetUrl = s.author ? `/u/${s.author.username}` : null;
        }
      } else if (r.targetType === "user") {
        const u = await prisma.user.findUnique({ where: { id: r.targetId } });
        if (u) {
          targetPreview = `@${u.username}${u.bio ? ` — ${u.bio.slice(0, 180)}` : ""}`;
          targetUrl = `/u/${u.username}`;
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
