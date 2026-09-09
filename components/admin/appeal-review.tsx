"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppealReview({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function decide(decision: "accept" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/appeals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success(decision === "accept" ? "Diterima — user di-unban" : "Ditolak");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan (opsional)"
        className="h-8 max-w-xs"
      />
      <Button size="sm" disabled={busy} onClick={() => decide("accept")}>
        Terima & unban
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => decide("reject")}
      >
        Tolak
      </Button>
    </div>
  );
}
