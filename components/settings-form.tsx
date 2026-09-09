"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/upload-client";

type Form = {
  name: string;
  username: string;
  bio: string;
  website: string;
  bannerColor: string;
  bannerImage: string;
};

export function SettingsForm({ initial }: { initial: Form }) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const set = (k: keyof Form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function uploadBanner(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Harus file gambar");
    setUploading(true);
    try {
      const up = await uploadFile(file, { prefix: "banner" });
      setForm((f) => ({ ...f, bannerImage: up.url }));
      toast.success("Banner terunggah — jangan lupa Simpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setForm((f) => ({ ...f, username: data.username }));
      toast.success("Profil disimpan");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Banner preview */}
      <div className="space-y-2">
        <Label>Banner profil</Label>
        <div
          className="relative h-32 overflow-hidden rounded-xl border bg-muted"
          style={
            form.bannerImage
              ? {
                  backgroundImage: `url(${form.bannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: `linear-gradient(135deg, ${form.bannerColor || "#5865F2"}, ${(form.bannerColor || "#5865F2")}99)`,
                }
          }
        >
          {form.bannerImage && (
            <button
              type="button"
              onClick={() => set("bannerImage")("")}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              title="Hapus gambar banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {form.bannerImage ? "Ganti gambar" : "Upload gambar"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadBanner(f);
              e.target.value = "";
            }}
          />
          <span className="text-xs text-muted-foreground">atau warna solid:</span>
          <input
            type="color"
            value={form.bannerColor || "#5865F2"}
            onChange={(e) => set("bannerColor")(e.target.value)}
            className="h-8 w-12 rounded border"
          />
          {form.bannerColor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set("bannerColor")("")}
            >
              Reset warna
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Gambar diprioritaskan di atas warna. Rasio ideal ~4:1 (mis. 1200×300).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama tampilan</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          maxLength={60}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={form.username}
          onChange={(e) => set("username")(e.target.value)}
          maxLength={24}
        />
        <p className="text-xs text-muted-foreground">
          /u/{form.username || "…"} — juga dipakai untuk mention
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={form.website}
          onChange={(e) => set("website")(e.target.value)}
          placeholder="https://…"
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => set("bio")(e.target.value)}
          maxLength={500}
          placeholder="Markdown didukung."
        />
      </div>
      <Button type="submit" disabled={busy || uploading}>
        {busy ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
