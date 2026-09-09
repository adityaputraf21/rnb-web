"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Cfg = {
  siteName: string;
  tagline: string;
  bannerText: string | null;
  bannerVariant: string;
  registrationOpen: boolean;
  maintenanceMode: boolean;
};

export function SiteSettingsForm({ initial }: { initial: Cfg }) {
  const router = useRouter();
  const [cfg, setCfg] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Setelan disimpan");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sn">Nama situs</Label>
          <Input
            id="sn"
            value={cfg.siteName}
            onChange={(e) => set("siteName", e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg">Tagline</Label>
          <Input
            id="tg"
            value={cfg.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            maxLength={80}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bt">Banner sitewide (kosongkan untuk sembunyikan)</Label>
        <Textarea
          id="bt"
          value={cfg.bannerText ?? ""}
          onChange={(e) => set("bannerText", e.target.value)}
          maxLength={200}
          placeholder="mis. Maintenance server Sabtu 20:00 WIB"
        />
        <div className="flex gap-2">
          {(["info", "warning", "success"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={cfg.bannerVariant === v ? "secondary" : "ghost"}
              onClick={() => set("bannerVariant", v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.registrationOpen}
          onChange={(e) => set("registrationOpen", e.target.checked)}
        />
        Pendaftaran dibuka (user baru boleh login)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.maintenanceMode}
          onChange={(e) => set("maintenanceMode", e.target.checked)}
        />
        Mode maintenance (user biasa tidak bisa posting)
      </label>

      <Button type="submit" disabled={busy}>
        {busy ? "Menyimpan…" : "Simpan setelan"}
      </Button>
    </form>
  );
}
