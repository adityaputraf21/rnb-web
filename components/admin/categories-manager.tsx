"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  locked: boolean;
  _count: { threads: number };
};

export function CategoriesManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [cats, setCats] = React.useState<Cat[]>(initial);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("#5865F2");
  const [busy, setBusy] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setCats((c) => [...c, { ...data, _count: { threads: 0 } }]);
      setName("");
      setDescription("");
      toast.success("Kategori dibuat");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    const updated = await res.json();
    setCats((c) => c.map((x) => (x.id === id ? { ...x, ...updated } : x)));
  }

  async function remove(id: string) {
    if (!confirm("Hapus kategori? Semua thread di dalamnya ikut terhapus."))
      return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("gagal");
    setCats((c) => c.filter((x) => x.id !== id));
    toast.success("Dihapus");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="space-y-2 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">Kategori baru</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-12 rounded border"
          />
        </div>
        <Input
          placeholder="Deskripsi (opsional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={busy}>
          Tambah
        </Button>
      </form>

      <Card className="divide-y">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            <span
              className="h-4 w-4 rounded"
              style={{ backgroundColor: c.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c._count.threads} thread · /{c.slug}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => patch(c.id, { locked: !c.locked })}
              title={c.locked ? "Buka kunci" : "Kunci"}
            >
              {c.locked ? <Lock /> : <LockOpen />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => remove(c.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
