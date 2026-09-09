import type { HeatCell } from "@/lib/heatmap";
import { cn } from "@/lib/utils";

const LEVELS = [
  "bg-muted",
  "bg-primary/30",
  "bg-primary/55",
  "bg-primary/80",
  "bg-primary",
];

function level(n: number) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

export function ActivityHeatmap({ cells }: { cells: HeatCell[] }) {
  // 7 baris (hari) x N kolom (minggu)
  const weeks: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const total = cells.reduce((s, c) => s + c.count, 0);

  return (
    <div className="rounded-xl border p-3">
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {w.map((c) => (
                <div
                  key={c.date}
                  title={`${c.date}: ${c.count} aktivitas`}
                  className={cn("h-3 w-3 rounded-[3px]", LEVELS[level(c.count)])}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} aktivitas dalam 26 minggu terakhir
      </p>
    </div>
  );
}
