"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Video feed ala Instagram: autoplay muted saat terlihat, tap pause, toggle suara. */
export function FeedVideo({
  src,
  className,
  onExpand,
}: {
  src: string;
  className?: string;
  onExpand?: () => void;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [showIcon, setShowIcon] = React.useState(false);
  const [inView, setInView] = React.useState(false);

  // Play/pause berdasarkan visibilitas
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting && e.intersectionRatio > 0.55),
      { threshold: [0, 0.55, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inView) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [inView]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 600);
  }

  return (
    <div className={cn("group relative bg-black", className)} onClick={toggle}>
      <video
        ref={ref}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* ikon pause/play sekejap */}
      {showIcon && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/50 p-3">
            {playing ? (
              <Play className="h-7 w-7 fill-white text-white" />
            ) : (
              <Pause className="h-7 w-7 fill-white text-white" />
            )}
          </span>
        </span>
      )}
      {!playing && !showIcon && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/40 p-3">
            <Play className="h-7 w-7 fill-white text-white" />
          </span>
        </span>
      )}

      {/* kontrol pojok */}
      <div className="absolute bottom-2 right-2 flex gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
            if (ref.current) ref.current.muted = !muted;
          }}
          className="rounded-full bg-black/50 p-1.5 text-white"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="rounded-full bg-black/50 p-1.5 text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
