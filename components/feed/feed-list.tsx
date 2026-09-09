"use client";

import * as React from "react";
import { StatusCard, type StatusView } from "@/components/feed/status-card";
import { Button } from "@/components/ui/button";

export function FeedList({
  initialItems,
  initialCursor,
  query = "",
  currentUsername,
  canModerate,
}: {
  initialItems: StatusView[];
  initialCursor: string | null;
  query?: string;
  currentUsername: string | null;
  canModerate: boolean;
}) {
  const [items, setItems] = React.useState(initialItems);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
  }, [initialItems, initialCursor]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/statuses?cursor=${cursor}&${query}`);
      const data = await res.json();
      setItems((p) => [...p, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Belum ada status di sini.
        </p>
      )}
      {items.map((s) => (
        <StatusCard
          key={s.id}
          status={s}
          currentUsername={currentUsername}
          canModerate={canModerate}
        />
      ))}
      {cursor && (
        <div className="pt-2 text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Memuat…" : "Muat lebih banyak"}
          </Button>
        </div>
      )}
    </div>
  );
}
