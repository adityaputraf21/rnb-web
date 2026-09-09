"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/upload-client";
import { initials } from "@/lib/utils";

type Form = {
  name: string;
  username: string;
  bio: string;
  website: string;
  bannerColor: string;
  bannerImage: string;
  image: string;
  mutedKeywords: string;
};

export function SettingsForm({ initial }: { initial: Form }) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState<null | "banner" | "avatar">(
    null,
  );
  const [syncing, setSyncing] = React.useState(false);
  const bannerRef = React.useRef<HTMLInputElement>(null);
  const avatarRef = React.useRef<HTMLInputElement>(null);
  const set = (k: keyof Form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function upload(file: File, kind: "banner" | "avatar") {
    if (!file.type.startsWith("image/")) return toast.error("Harus file gambar");
    setUploading(kind);
    try {
      const up = await uploadFile(file, { prefix: kind });
      setForm((f) => ({
        ...f,
        [kind === "banner" ? "bannerImage" : "image"]: up.url,
      }));
      toast.success("Terunggah — jangan lupa Simpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setUploading(null);
    }
  }

  async function syncDiscord() {
    setSyncing(true);
    try {
      const res = await fetch("/api/profile/sync-discord", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setForm((f) => ({ ...f, name: data.name ?? f.name, image: data.image ?? f.image }));
      toast.success("Nama & avatar diambil dari Discord");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setSyncing(false);
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
      {/* Avatar */}
      <div className="space-y-2">
        <Label>Foto profil</Label>
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={form.image || undefined} />
            <AvatarFallback>{initials(form.name || form.username)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading === "avatar"}
              onClick={() => avatarRef.current?.click()}
            >
              {uploading === "avatar" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ImagePlus />
              )}
              Upload
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={syncing}
              onClick={syncDiscord}
            >
              {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Ambil dari Discord
            </Button>
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f, "avatar");
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Banner */}
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
            disabled={uploading === "banner"}
            onClick={() => bannerRef.current?.click()}
          >
            {uploading === "banner" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ImagePlus />
            )}
            {form.bannerImage ? "Ganti" : "Upload"}
          </Button>
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f, "banner");
              e.target.value = "";
            }}
          />
          <span className="text-xs text-muted-foreground">atau warna:</span>
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
      <div className="space-y-1.5">
        <Label htmlFor="mutedKeywords">Kata yang dibisukan</Label>
        <Textarea
          id="mutedKeywords"
          value={form.mutedKeywords}
          onChange={(e) => set("mutedKeywords")(e.target.value)}
          placeholder="pisahkan dengan koma, mis: spoiler, promosi"
        />
        <p className="text-xs text-muted-foreground">
          Status yang mengandung kata-kata ini disembunyikan dari feed kamu.
        </p>
      </div>
      <Button type="submit" disabled={busy || !!uploading}>
        {busy ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
