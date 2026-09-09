"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function CreateEventDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    date: "",
    location: "",
    description: "",
  });
  const [busy, setBusy] = React.useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Event dibuat");
      setOpen(false);
      setForm({ title: "", date: "", location: "", description: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="e-title">Judul</Label>
            <Input id="e-title" value={form.title} onChange={set("title")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-date">Tanggal</Label>
              <Input
                id="e-date"
                type="datetime-local"
                value={form.date}
                onChange={set("date")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-loc">Lokasi</Label>
              <Input
                id="e-loc"
                value={form.location}
                onChange={set("location")}
                placeholder="Discord / Zoom / …"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-desc">Deskripsi</Label>
            <Textarea
              id="e-desc"
              value={form.description}
              onChange={set("description")}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Membuat…" : "Buat + kirim ke Discord"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
