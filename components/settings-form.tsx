"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({
  initial,
}: {
  initial: {
    name: string;
    username: string;
    bio: string;
    website: string;
    bannerColor: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
    <form onSubmit={submit} className="space-y-4">
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
        <Label htmlFor="banner">Warna banner profil</Label>
        <div className="flex items-center gap-2">
          <input
            id="banner"
            type="color"
            value={form.bannerColor || "#5865F2"}
            onChange={(e) => set("bannerColor")(e.target.value)}
            className="h-9 w-14 rounded border"
          />
          {form.bannerColor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set("bannerColor")("")}
            >
              Reset
            </Button>
          )}
        </div>
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
      <Button type="submit" disabled={busy}>
        {busy ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
