"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    function onQuote(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setBody((prev) => (prev ? `${prev}\n${detail}` : detail));
    }
    window.addEventListener("rnb:quote", onQuote);
    return () => window.removeEventListener("rnb:quote", onQuote);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 2) return toast.error("Balasan kosong");
    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setBody("");
      toast.success("Balasan terkirim");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2" id="reply-anchor">
      <h3 className="text-sm font-semibold">Balas</h3>
      <MarkdownEditor value={body} onChange={setBody} minHeight={120} />
      <Button type="submit" disabled={busy}>
        {busy ? "Mengirim…" : "Kirim balasan"}
      </Button>
    </form>
  );
}
