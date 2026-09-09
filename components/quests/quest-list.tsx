"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type QuestRow = {
  key: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  count: number;
  done: boolean;
  claimed: boolean;
};

export function QuestList({ quests }: { quests: QuestRow[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState(quests);
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => setRows(quests), [quests]);

  async function claim(key: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success(`+${data.reward} poin!`);
      setRows((p) => p.map((r) => (r.key === key ? { ...r, claimed: true } : r)));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {rows.map((q) => {
        const pct = Math.min(100, Math.round((q.count / q.target) * 100));
        return (
          <Card key={q.key} className={cn(q.claimed && "opacity-60")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{q.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {q.description}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                  <Gift className="h-4 w-4" />+{q.reward}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      q.done ? "bg-green-500" : "bg-primary",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                  {Math.min(q.count, q.target)}/{q.target}
                </span>
                {q.claimed ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="h-4 w-4" /> Diklaim
                  </span>
                ) : (
                  <Button
                    size="sm"
                    disabled={!q.done || busy === q.key}
                    onClick={() => claim(q.key)}
                  >
                    Klaim
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
