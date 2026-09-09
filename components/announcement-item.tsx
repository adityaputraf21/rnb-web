"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Markdown } from "@/components/markdown";

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  source: string;
  authorName: string | null;
  createdLabel: string;
};

export function AnnouncementItem({
  a,
  canManage,
}: {
  a: AnnouncementView;
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(a.title);
  const [body, setBody] = React.useState(a.body);
  const [pinned, setPinned] = React.useState(a.pinned);
  const [busy, setBusy] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/announcements/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, pinned }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Pengumuman diperbarui");
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Hapus pengumuman ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/announcements/${a.id}`, { method: "DELETE" });
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {a.pinned && <Pin className="h-4 w-4 text-primary" />}
          {a.title}
          <div className="ml-auto flex items-center gap-1">
            <Badge variant="secondary">
              {a.source === "discord" ? "via Discord" : "web"}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <Pencil /> Sunting
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      fetch(`/api/announcements/${a.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pinned: !a.pinned }),
                      }).then(() => router.refresh())
                    }
                  >
                    <Pin /> {a.pinned ? "Lepas sematan" : "Sematkan"}
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
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {a.authorName ?? "Tim"} · {a.createdLabel}
        </p>
      </CardHeader>
      <CardContent>
        <Markdown>{a.body}</Markdown>
      </CardContent>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sunting pengumuman</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`t-${a.id}`}>Judul</Label>
              <Input
                id={`t-${a.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`b-${a.id}`}>Isi</Label>
              <Textarea
                id={`b-${a.id}`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-32"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              Sematkan di atas
            </label>
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
