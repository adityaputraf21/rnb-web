"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Appeal = {
  id: string;
  body: string;
  status: "OPEN" | "ACCEPTED" | "REJECTED";
  note: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<Appeal["status"], string> = {
  OPEN: "Menunggu peninjauan",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
};

export function AppealForm({ initial }: { initial: Appeal[] }) {
  const [appeals, setAppeals] = React.useState<Appeal[]>(initial);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const hasOpen = appeals.some((a) => a.status === "OPEN");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success("Banding terkirim");
      setBody("");
      setAppeals((p) => [
        {
          id: crypto.randomUUID(),
          body,
          status: "OPEN",
          note: null,
          createdAt: new Date().toISOString(),
        },
        ...p,
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {appeals.length > 0 && (
        <div className="space-y-2">
          {appeals.map((a) => (
            <div key={a.id} className="rounded-lg border p-3">
              <p className="font-medium">{STATUS_LABEL[a.status]}</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {a.body}
              </p>
              {a.note && (
                <p className="mt-1 text-xs">
                  Catatan moderator:{" "}
                  <span className="text-muted-foreground">{a.note}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasOpen && (
        <form onSubmit={submit} className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Jelaskan kenapa blokir ini keliru…"
            maxLength={2000}
            className="min-h-28"
          />
          <Button type="submit" disabled={busy || body.trim().length < 20}>
            {busy ? "Mengirim…" : "Kirim banding"}
          </Button>
        </form>
      )}
    </div>
  );
}
