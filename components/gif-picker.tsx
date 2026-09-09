"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

type Gif = { id: string; url: string; preview: string; alt: string };

export function GifPicker({
  onPick,
  trigger,
}: {
  onPick: (url: string) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [gifs, setGifs] = React.useState<Gif[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);

  const load = React.useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setDisabled(!!data.disabled);
      setGifs((data.results ?? []).filter((g: Gif) => g.url));
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [open, q, load]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm">
            GIF
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        {disabled ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Fitur GIF belum diaktifkan admin.
          </p>
        ) : (
          <>
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari GIF di Tenor…"
              className="mb-2 h-8"
            />
            <div className="grid max-h-72 grid-cols-2 gap-1 overflow-y-auto">
              {loading && (
                <div className="col-span-2 flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading &&
                gifs.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onPick(g.url);
                      setOpen(false);
                    }}
                    className="overflow-hidden rounded-md border hover:opacity-80"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.preview}
                      alt={g.alt}
                      loading="lazy"
                      className="h-24 w-full object-cover"
                    />
                  </button>
                ))}
              {!loading && gifs.length === 0 && (
                <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">
                  Tidak ada hasil.
                </p>
              )}
            </div>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              via Tenor
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
