"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageGrid({ urls }: { urls: string[] }) {
  const [open, setOpen] = React.useState<string | null>(null);
  if (urls.length === 0) return null;

  const layout =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
        ? "grid-cols-2"
        : "grid-cols-2";

  return (
    <>
      <div
        className={cn(
          "mt-2 grid gap-1 overflow-hidden rounded-xl border",
          layout,
        )}
      >
        {urls.slice(0, 4).map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setOpen(u)}
            className={cn(
              "relative bg-muted",
              urls.length === 3 && i === 0 && "row-span-2",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u}
              alt=""
              loading="lazy"
              className={cn(
                "h-full w-full object-cover",
                urls.length === 1 ? "max-h-[28rem]" : "aspect-square",
              )}
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setOpen(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
