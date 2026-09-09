"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function WikiRevertButton({
  slug,
  revisionId,
}: {
  slug: string;
  revisionId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function revert() {
    if (!confirm("Kembalikan halaman ke versi ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/wiki/${slug}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Dikembalikan");
      router.push(`/wiki/${slug}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={revert}>
      <RotateCcw className="h-3.5 w-3.5" /> Kembalikan
    </Button>
  );
}
