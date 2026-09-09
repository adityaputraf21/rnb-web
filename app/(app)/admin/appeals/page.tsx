import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import { AppealReview } from "@/components/admin/appeal-review";

export const metadata = { title: "Banding ban" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  OPEN: "Menunggu",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
};

export default async function AdminAppealsPage() {
  await requireRole("MODERATOR", "/admin/appeals");

  const appeals = await prisma.appeal.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: { select: { username: true, name: true, banReason: true } },
      reviewer: { select: { username: true } },
    },
  });

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Banding ban ({appeals.length})</h2>
      {appeals.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada banding.</p>
      )}
      {appeals.map((a) => (
        <Card key={a.id} className="p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/u/${a.user.username}`}
              className="font-medium hover:underline"
            >
              {a.user.name ?? a.user.username}
            </Link>
            <Badge variant={a.status === "OPEN" ? "default" : "secondary"}>
              {STATUS[a.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {timeAgo(a.createdAt)}
            </span>
          </div>
          {a.user.banReason && (
            <p className="mt-1 text-xs text-muted-foreground">
              Alasan ban: {a.user.banReason}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap">{a.body}</p>
          {a.note && (
            <p className="mt-1 text-xs text-muted-foreground">
              Catatan {a.reviewer ? `@${a.reviewer.username}` : ""}: {a.note}
            </p>
          )}
          {a.status === "OPEN" && <AppealReview id={a.id} />}
        </Card>
      ))}
    </div>
  );
}
