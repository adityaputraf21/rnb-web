"use client";

import * as React from "react";
import { X, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedVideo } from "@/components/feed/feed-video";

export type Media = { url: string; type: string; name?: string };

export function MediaGrid({ media }: { media: Media[] }) {
  const [open, setOpen] = React.useState<Media | null>(null);
  if (media.length === 0) return null;

  const visual = media.filter((m) => m.type === "image" || m.type === "video");
  const files = media.filter((m) => m.type !== "image" && m.type !== "video");

  const single = visual.length === 1;
  const cols = single ? "grid-cols-1" : "grid-cols-2";

  return (
    <>
      {visual.length > 0 && (
        <div className={cn("mt-2 grid gap-1 overflow-hidden rounded-xl border", cols)}>
          {visual.slice(0, 4).map((m, i) => {
            const isLast = i === 3 && visual.length > 4;
            const sizing = single ? "max-h-[30rem]" : "aspect-square";

            // Video tunggal: player inline autoplay ala IG
            if (m.type === "video" && single) {
              return (
                <FeedVideo
                  key={m.url}
                  src={m.url}
                  className={cn("h-full w-full", sizing)}
                  onExpand={() => setOpen(m)}
                />
              );
            }

            return (
              <button
                key={m.url}
                type="button"
                onClick={() => setOpen(m)}
                className={cn(
                  "relative bg-muted",
                  visual.length === 3 && i === 0 && "row-span-2",
                )}
              >
                {m.type === "video" ? (
                  <>
                    <video
                      src={m.url}
                      className={cn("h-full w-full object-cover", sizing)}
                      muted
                      preload="metadata"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/40 p-2">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt=""
                    loading="lazy"
                    className={cn("h-full w-full object-cover", sizing)}
                  />
                )}
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
                    +{visual.length - 4}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {files.map((f) => (
        <a
          key={f.url}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-accent/50"
        >
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{f.name || "Lampiran"}</span>
          <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      ))}

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
        >
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white">
            <X className="h-5 w-5" />
          </button>
          {open.type === "video" ? (
            <video
              src={open.url}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={open.url}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
