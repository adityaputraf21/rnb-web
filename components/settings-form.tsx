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
  initial: { name: string; username: string; bio: string };
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initial.name);
  const [username, setUsername] = React.useState(initial.username);
  const [bio, setBio] = React.useState(initial.bio);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setUsername(data.username);
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
        />
        <p className="text-xs text-muted-foreground">
          Dipakai di URL profil & mention: /u/{username || "…"}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
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
