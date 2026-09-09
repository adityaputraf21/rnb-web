"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type EventView = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateLabel: string;
  dateInput: string; // untuk <input type=datetime-local>
  whenLabel: string;
  createdByName: string | null;
  past: boolean;
};

export function EventItem({
  e,
  canManage,
}: {
  e: EventView;
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    title: e.title,
    date: e.dateInput,
    location: e.location ?? "",
    description: e.description ?? "",
  });
  const [busy, setBusy] = React.useState(false);
  const set =
    (k: keyof typeof form) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: ev.target.value }));

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Event diperbarui");
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Hapus event ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${e.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Dihapus");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={e.past ? "opacity-70" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{e.title}</h3>
          <div className="flex items-center gap-1">
            <Badge variant="secondary">{e.whenLabel}</Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <Pencil /> Sunting
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={remove}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {e.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {e.location}
          </p>
        )}
        {e.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {e.description}
          </p>
        )}
        {e.createdByName && (
          <p className="mt-2 text-xs text-muted-foreground">
            oleh {e.createdByName}
          </p>
        )}
      </CardContent>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sunting event</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`et-${e.id}`}>Judul</Label>
              <Input id={`et-${e.id}`} value={form.title} onChange={set("title")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`ed-${e.id}`}>Tanggal</Label>
                <Input
                  id={`ed-${e.id}`}
                  type="datetime-local"
                  value={form.date}
                  onChange={set("date")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`el-${e.id}`}>Lokasi</Label>
                <Input
                  id={`el-${e.id}`}
                  value={form.location}
                  onChange={set("location")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`ex-${e.id}`}>Deskripsi</Label>
              <Textarea
                id={`ex-${e.id}`}
                value={form.description}
                onChange={set("description")}
                className="min-h-24"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? "Menyimpan…" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
