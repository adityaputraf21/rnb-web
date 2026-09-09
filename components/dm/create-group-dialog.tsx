"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateGroupDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [members, setMembers] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const usernames = members
        .split(/[\s,]+/)
        .map((u) => u.replace(/^@/, "").trim())
        .filter(Boolean);
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, usernames }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setOpen(false);
      setName("");
      setMembers("");
      router.push(`/groups/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> Grup baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Buat grup chat
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="gname">Nama grup</Label>
            <Input
              id="gname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gmembers">Anggota</Label>
            <Input
              id="gmembers"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="username1, username2, …"
            />
            <p className="text-xs text-muted-foreground">
              Pisahkan dengan koma atau spasi. Kamu otomatis jadi anggota.
            </p>
          </div>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Membuat…" : "Buat grup"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
