export function MiniBars({
  data,
  label,
}: {
  data: { day: string; count: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{total} / 30 hari</span>
      </div>
      <div className="flex h-16 items-end gap-0.5">
        {data.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${d.count}`}
            className="flex-1 rounded-sm bg-primary/70"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
          />
        ))}
      </div>
    </div>
  );
}
