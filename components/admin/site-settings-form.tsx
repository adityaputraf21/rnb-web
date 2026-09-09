"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

type Cfg = {
  siteName: string;
  tagline: string;
  bannerText: string | null;
  bannerVariant: string;
  registrationOpen: boolean;
  maintenanceMode: boolean;
  webhookUsername: string;
  webhookAvatar: string | null;
  bannedWords: string | null;
};

export function SiteSettingsForm({ initial }: { initial: Cfg }) {
  const router = useRouter();
  const [cfg, setCfg] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Harus gambar");
    if (file.size > MAX_UPLOAD_BYTES)
      return toast.error(`Maks ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      set("webhookAvatar", data.url);
      toast.success("Avatar terunggah — jangan lupa Simpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setUploading(false);
    }
  }

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
    <form onSubmit={save} className="space-y-5">
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

      {/* Identitas webhook Discord */}
      <div className="space-y-2 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Identitas notifikasi Discord</h2>
        <p className="text-xs text-muted-foreground">
          Nama & avatar yang muncul saat website mengirim ke Discord (thread,
          event, pengumuman, mod-log).
        </p>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-muted">
            {cfg.webhookAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cfg.webhookAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="wu">Nama pengirim</Label>
            <Input
              id="wu"
              value={cfg.webhookUsername}
              onChange={(e) => set("webhookUsername", e.target.value)}
              maxLength={80}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {cfg.webhookAvatar ? "Ganti avatar" : "Upload avatar"}
          </Button>
          {cfg.webhookAvatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set("webhookAvatar", null)}
            >
              <X className="h-4 w-4" /> Hapus
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bw">Kata terlarang (auto-mod)</Label>
        <Textarea
          id="bw"
          value={cfg.bannedWords ?? ""}
          onChange={(e) => set("bannedWords", e.target.value)}
          placeholder="Satu kata/frasa per baris. Konten yang mengandungnya akan ditolak."
          className="min-h-24 font-mono text-xs"
        />
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

      <Button type="submit" disabled={busy || uploading}>
        {busy ? "Menyimpan…" : "Simpan setelan"}
      </Button>
    </form>
  );
}
