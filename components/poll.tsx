"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PollData = {
  id: string;
  question: string;
  multiple: boolean;
  closesAt: string | null;
  options: { id: string; text: string; count: number }[];
  myVotes: string[];
};

export function Poll({
  poll,
  loggedIn,
}: {
  poll: PollData;
  loggedIn: boolean;
}) {
  const [options, setOptions] = React.useState(poll.options);
  const [myVotes, setMyVotes] = React.useState<string[]>(poll.myVotes);
  const [busy, setBusy] = React.useState(false);

  const closed = !!poll.closesAt && new Date(poll.closesAt) < new Date();
  const total = options.reduce((s, o) => s + o.count, 0);
  const voted = myVotes.length > 0;
  const showResults = voted || closed;

  async function vote(optionId: string) {
    if (!loggedIn) return toast.error("Masuk dulu");
    if (closed) return;
    const next = poll.multiple
      ? myVotes.includes(optionId)
        ? myVotes.filter((x) => x !== optionId)
        : [...myVotes, optionId]
      : [optionId];
    if (next.length === 0) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setMyVotes(data.voted);
      setOptions((prev) =>
        prev.map((o) => ({
          ...o,
          count:
            data.counts.find((c: { optionId: string }) => c.optionId === o.id)
              ?.count ?? 0,
        })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 rounded-xl border p-3">
      <p className="mb-2 text-sm font-semibold">{poll.question}</p>
      <div className="space-y-1.5">
        {options.map((o) => {
          const pct = total > 0 ? Math.round((o.count / total) * 100) : 0;
          const mine = myVotes.includes(o.id);
          return (
            <button
              key={o.id}
              disabled={busy || closed}
              onClick={() => vote(o.id)}
              className={cn(
                "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                mine ? "border-primary" : "hover:bg-accent",
                closed && "cursor-default",
              )}
            >
              {showResults && (
                <span
                  className="absolute inset-y-0 left-0 bg-primary/15"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-2">
                <span>
                  {mine && "✓ "}
                  {o.text}
                </span>
                {showResults && (
                  <span className="text-xs text-muted-foreground">
                    {pct}% ({o.count})
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} suara
        {poll.multiple && " · pilihan ganda"}
        {closed
          ? " · ditutup"
          : poll.closesAt &&
            ` · tutup ${new Date(poll.closesAt).toLocaleDateString("id-ID")}`}
      </p>
    </div>
  );
}
