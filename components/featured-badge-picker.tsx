"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ACHIEVEMENTS } from "@/lib/achievements-data";
import { cn } from "@/lib/utils";

export function FeaturedBadgePicker({
  earned,
  initial,
}: {
  earned: string[];
  initial: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const earnedSet = new Set(earned);
  const options = ACHIEVEMENTS.filter((a) => earnedSet.has(a.key));

  async function pick(key: string | null) {
    setBusy(true);
    const next = selected === key ? null : key;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredAchievement: next ?? "" }),
      });
      if (!res.ok) throw new Error();
      setSelected(next);
      router.refresh();
    } catch {
      toast.error("Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Badge unggulan</h2>
      <p className="text-xs text-muted-foreground">
        Satu achievement yang dipajang di sebelah namamu.
      </p>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada achievement. Aktif dulu di forum & feed.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((a) => (
            <button
              key={a.key}
              type="button"
              disabled={busy}
              onClick={() => pick(a.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                selected === a.key
                  ? "border-primary bg-primary/10 font-medium"
                  : "hover:bg-accent",
              )}
            >
              <span>{a.emoji}</span>
              {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
