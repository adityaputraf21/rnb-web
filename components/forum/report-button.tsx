"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function ReportButton({
  targetType,
  targetId,
  label,
}: {
  targetType: "post" | "thread" | "status";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) return toast.error("Jelaskan alasannya");
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success("Laporan terkirim ke moderator");
      setOpen(false);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" /> {label ?? "Laporkan"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan {targetType === "post" ? "balasan" : targetType === "status" ? "status" : "thread"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Kenapa konten ini melanggar? (spam, kasar, dll)"
            className="min-h-24"
          />
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy ? "Mengirim…" : "Kirim laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
