"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { PollComposer, pollPayload, type PollDraft } from "@/components/poll-composer";

export function NewThreadForm({
  categoryId,
  categorySlug,
}: {
  categoryId: string;
  categorySlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [poll, setPoll] = React.useState<PollDraft | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 4) return toast.error("Judul minimal 4 karakter");
    if (body.trim().length < 2) return toast.error("Isi tidak boleh kosong");
    setSubmitting(true);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, title, body, poll: pollPayload(poll) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal membuat thread");
      toast.success("Thread dibuat");
      router.push(data.url);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ringkas dan jelas"
          maxLength={160}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Isi</Label>
        <MarkdownEditor value={body} onChange={setBody} minHeight={220} />
      </div>
      <PollComposer value={poll} onChange={setPoll} />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Memposting…" : "Posting thread"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/forum/${categorySlug}`)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
