"use client";

import * as React from "react";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { timeAgo } from "@/lib/format";

type Note = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
};

export function ModNotesDialog({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/notes`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [open, userId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setNotes((p) => [data, ...p]);
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Catatan moderator">
          <StickyNote className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catatan moderator — @{username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={add} className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Catatan internal, hanya terlihat moderator…"
            className="min-h-20"
          />
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>
            {busy ? "Menyimpan…" : "Tambah catatan"}
          </Button>
        </form>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading && (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          )}
          {!loading && notes.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
          )}
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border p-2 text-sm">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                @{n.author} · {timeAgo(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
