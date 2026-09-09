import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { fullDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole("MODERATOR", "/admin/audit");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { moderator: { select: { username: true } } },
  });

  return (
    <Card className="divide-y">
      {logs.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">Belum ada log.</p>
      )}
      {logs.map((l) => (
        <div key={l.id} className="p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{l.action}</span>
            <span className="text-xs text-muted-foreground">
              {fullDate(l.createdAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {l.moderator?.username ?? "sistem"} → {l.targetType}:{l.targetId}
            {l.meta ? ` · ${JSON.stringify(l.meta)}` : ""}
          </p>
        </div>
      ))}
    </Card>
  );
}
