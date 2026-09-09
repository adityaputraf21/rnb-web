"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DiscordSync() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function sync() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/sync-roles", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      if (data.changed) toast.success(`Role diperbarui: ${data.role}`);
      else if (!data.inGuild)
        toast.warning("Kamu belum terdeteksi di server Discord.");
      else toast.success("Sudah sinkron — tidak ada perubahan.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Integrasi Discord</h2>
      <p className="text-xs text-muted-foreground">
        Sinkronkan role dari server Discord komunitas. Kalau baru dapat role
        moderator/admin di Discord, klik ini.
      </p>
      <Button variant="outline" size="sm" disabled={busy} onClick={sync}>
        {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Sinkron role Discord
      </Button>
    </div>
  );
}
