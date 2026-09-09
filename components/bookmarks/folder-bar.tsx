"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Folder = { id: string; name: string; count: number };

export function FolderBar({
  folders,
  active,
  total,
  uncategorized,
}: {
  folders: Folder[];
  active: string | null;
  total: number;
  uncategorized: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const activeFolder = folders.find((f) => f.id === active) ?? null;

  async function create() {
    const name = prompt("Nama folder baru:");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/bookmark-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function rename() {
    if (!activeFolder) return;
    const name = prompt("Nama baru:", activeFolder.name);
    if (!name?.trim()) return;
    const res = await fetch(`/api/bookmark-folders/${activeFolder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) router.refresh();
    else toast.error("Gagal");
  }

  async function remove() {
    if (!activeFolder || !confirm(`Hapus folder "${activeFolder.name}"?`)) return;
    const res = await fetch(`/api/bookmark-folders/${activeFolder.id}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/bookmarks");
    else toast.error("Gagal");
  }

  const chip = (href: string, label: string, count: number, on: boolean) => (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        on ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent",
      )}
    >
      {label} <span className="text-muted-foreground">{count}</span>
    </Link>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {chip("/bookmarks", "Semua", total, active === null)}
        {chip(
          "/bookmarks?folder=none",
          "Tanpa folder",
          uncategorized,
          active === "none",
        )}
        {folders.map((f) =>
          chip(`/bookmarks?folder=${f.id}`, f.name, f.count, active === f.id),
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={create}>
          <Plus className="h-4 w-4" /> Folder
        </Button>
      </div>
      {activeFolder && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={rename}>
            <Pencil className="h-3.5 w-3.5" /> Ganti nama
          </Button>
          <Button size="sm" variant="outline" onClick={remove}>
            <Trash2 className="h-3.5 w-3.5" /> Hapus folder
          </Button>
        </div>
      )}
    </div>
  );
}
