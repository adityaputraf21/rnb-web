"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ImagePlus, X, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "@/lib/upload-client";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  published: boolean;
};

const BLANK = {
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  coverImage: "",
  published: false,
};

export function BlogManager({ initial }: { initial: ArticleRow[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState(initial);
  const [editing, setEditing] = React.useState<typeof BLANK | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const coverRef = React.useRef<HTMLInputElement>(null);

  function open(row?: ArticleRow) {
    setEditing(
      row
        ? {
            id: row.id,
            slug: row.slug,
            title: row.title,
            excerpt: row.excerpt ?? "",
            body: row.body,
            coverImage: row.coverImage ?? "",
            published: row.published,
          }
        : { ...BLANK },
    );
  }

  async function cover(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Harus gambar");
    setUploading(true);
    try {
      const up = await uploadFile(file, { prefix: "blog" });
      setEditing((e) => (e ? { ...e, coverImage: up.url } : e));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setUploading(false);
    }
  }

  async function save(publish?: boolean) {
    if (!editing) return;
    setBusy(true);
    try {
      const isNew = !editing.id;
      const payload = {
        title: editing.title,
        excerpt: editing.excerpt,
        body: editing.body,
        coverImage: editing.coverImage,
        published: publish ?? editing.published,
      };
      const res = await fetch(
        isNew ? "/api/articles" : `/api/articles/${editing.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success(isNew ? "Artikel dibuat" : "Tersimpan");
      setEditing(null);
      router.refresh();
      setRows((prev) => {
        const row: ArticleRow = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          body: data.body,
          coverImage: data.coverImage,
          published: data.published,
        };
        return isNew
          ? [row, ...prev]
          : prev.map((r) => (r.id === row.id ? row : r));
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus artikel ini?")) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal");
    setRows((p) => p.filter((r) => r.id !== id));
    router.refresh();
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {editing.id ? "Sunting artikel" : "Artikel baru"}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <X /> Tutup
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Judul</Label>
          <Input
            value={editing.title}
            onChange={(e) =>
              setEditing((s) => s && { ...s, title: e.target.value })
            }
            maxLength={160}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Ringkasan (opsional)</Label>
          <Textarea
            value={editing.excerpt}
            onChange={(e) =>
              setEditing((s) => s && { ...s, excerpt: e.target.value })
            }
            maxLength={300}
            className="min-h-16"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Gambar sampul</Label>
          {editing.coverImage ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editing.coverImage}
                alt=""
                className="max-h-48 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setEditing((s) => s && { ...s, coverImage: "" })
                }
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => coverRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ImagePlus />
              )}
              Upload sampul
            </Button>
          )}
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) cover(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Isi (Markdown)</Label>
          <Textarea
            value={editing.body}
            onChange={(e) =>
              setEditing((s) => s && { ...s, body: e.target.value })
            }
            className="min-h-72 font-mono text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => save(editing.published)}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
          {!editing.published && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => save(true)}
            >
              Simpan & terbitkan
            </Button>
          )}
          {editing.published && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => save(false)}
            >
              Jadikan draf
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Artikel ({rows.length})</h2>
        <Button size="sm" onClick={() => open()}>
          <Plus /> Baru
        </Button>
      </div>
      <Card className="divide-y">
        {rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Belum ada artikel.</p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate font-medium">
                {r.title}
                {r.published ? (
                  <Badge variant="secondary">Terbit</Badge>
                ) : (
                  <Badge variant="outline">Draf</Badge>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">/blog/{r.slug}</p>
            </div>
            {r.published && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/blog/${r.slug}`}>Lihat</Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => open(r)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(r.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
