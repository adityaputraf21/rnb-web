"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/forum/markdown-editor";

export function WikiEditor({
  slug,
  initialTitle = "",
  initialBody = "",
}: {
  slug?: string;
  initialTitle?: string;
  initialBody?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [body, setBody] = React.useState(initialBody);
  const [summary, setSummary] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(slug ? `/api/wiki/${slug}` : "/api/wiki", {
        method: slug ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, summary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success("Tersimpan");
      router.push(`/wiki/${data.slug ?? slug}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Judul</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
          disabled={!!slug}
        />
        {slug && (
          <p className="text-xs text-muted-foreground">
            Judul halaman yang sudah ada tidak bisa diubah di sini.
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Isi (Markdown)</Label>
        <MarkdownEditor value={body} onChange={setBody} minHeight={320} />
      </div>
      <div className="space-y-1.5">
        <Label>Ringkasan perubahan (opsional)</Label>
        <Input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={200}
          placeholder="mis. Tambah bagian FAQ"
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
