"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJIS = ["👍", "❤️", "🔥", "🎉", "😂", "😮", "😢"];
type Count = { emoji: string; count: number };

/** Bar reaksi emoji generik — dipakai post forum & status feed. */
export function ReactionBar({
  endpoint,
  initialCounts,
  initialMine,
  canReact,
}: {
  endpoint: string;
  initialCounts: Count[];
  initialMine: string[];
  canReact: boolean;
}) {
  const [counts, setCounts] = React.useState<Count[]>(initialCounts);
  const [mine, setMine] = React.useState<string[]>(initialMine);
  const [busy, setBusy] = React.useState(false);

  async function toggle(emoji: string) {
    if (!canReact) return toast.error("Masuk dulu untuk bereaksi");
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setCounts(data.counts);
      setMine((p) => (data.active ? [...p, emoji] : p.filter((e) => e !== emoji)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {counts
        .filter((c) => c.count > 0)
        .map((c) => (
          <button
            key={c.emoji}
            type="button"
            onClick={() => toggle(c.emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              mine.includes(c.emoji)
                ? "border-primary bg-primary/10"
                : "hover:bg-accent",
            )}
          >
            <span>{c.emoji}</span>
            <span className="tabular-nums">{c.count}</span>
          </button>
        ))}
      {canReact && (
        <Popover>
          <PopoverTrigger className="flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-accent">
            <SmilePlus className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent className="flex w-auto gap-1 p-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => toggle(e)}
                className="rounded p-1 text-lg hover:bg-accent"
              >
                {e}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
