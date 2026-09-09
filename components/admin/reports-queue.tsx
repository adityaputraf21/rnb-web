"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { username: string } | null;
  targetUrl: string | null;
  targetPreview: string | null;
};

export function ReportsQueue({ initial }: { initial: Report[] }) {
  const router = useRouter();
  const [reports, setReports] = React.useState(initial);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function resolve(
    id: string,
    status: "RESOLVED" | "DISMISSED",
    action?: "delete",
  ) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      setReports((r) => r.filter((x) => x.id !== id));
      toast.success("Laporan diproses");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(null);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tidak ada laporan yang perlu ditindak. 🎉
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {r.targetType} · dilaporkan {timeAgo(r.createdAt)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              oleh @{r.reporter?.username ?? "?"}
            </span>
          </div>
          <p className="mt-2 text-sm">{r.reason}</p>
          {r.targetPreview && (
            <p className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground line-clamp-3">
              {r.targetPreview}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {r.targetUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link href={r.targetUrl} target="_blank">
                  Lihat konten
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              disabled={busy === r.id}
              onClick={() => resolve(r.id, "RESOLVED", "delete")}
            >
              Hapus konten + tutup
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy === r.id}
              onClick={() => resolve(r.id, "RESOLVED")}
            >
              Tandai selesai
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy === r.id}
              onClick={() => resolve(r.id, "DISMISSED")}
            >
              Abaikan
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
