"use client";

import * as React from "react";
import { X, Trash2, Eye, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { StoryGroup } from "@/components/stories/types";

const IMAGE_MS = 5000;
const STORY_EMOJIS = ["❤️", "🔥", "😂", "😮", "😢", "👏", "💯"];

export function StoryViewer({
  groups,
  startGroup,
  onClose,
  onViewed,
}: {
  groups: StoryGroup[];
  startGroup: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
}) {
  const [gi, setGi] = React.useState(startGroup);
  const [si, setSi] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [viewers, setViewers] = React.useState<
    { username: string; name: string | null; image: string | null; at: string }[] | null
  >(null);
  const [reply, setReply] = React.useState("");
  const [replyFocus, setReplyFocus] = React.useState(false);
  const group = groups[gi];
  const story = group?.items[si];
  const timerRef = React.useRef<number | null>(null);
  const paused = viewers !== null || replyFocus;

  async function sendReply() {
    if (!story || !reply.trim()) return;
    const res = await fetch(`/api/stories/${story.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    if (res.ok) {
      toast.success("Balasan terkirim ke DM");
      setReply("");
    } else {
      toast.error((await res.json()).error ?? "gagal");
    }
  }

  async function quickReact(emoji: string) {
    if (!story) return;
    await fetch(`/api/stories/${story.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    toast.success(`Reaksi ${emoji} terkirim`);
  }

  async function openViewers() {
    if (!story) return;
    const res = await fetch(`/api/stories/${story.id}/views`);
    setViewers(res.ok ? await res.json() : []);
  }

  const next = React.useCallback(() => {
    if (!group) return;
    if (si + 1 < group.items.length) {
      setSi(si + 1);
    } else if (gi + 1 < groups.length) {
      setGi(gi + 1);
      setSi(0);
    } else {
      onClose();
    }
    setProgress(0);
  }, [group, si, gi, groups.length, onClose]);

  const prev = React.useCallback(() => {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      setGi(gi - 1);
      setSi(groups[gi - 1].items.length - 1);
    }
    setProgress(0);
  }, [si, gi, groups]);

  // mark viewed + auto-advance for images
  React.useEffect(() => {
    if (!story) return;
    if (!story.viewed && !story.mine) onViewed(story.id);
    fetch(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => {});

    if (story.mediaType === "image" && !paused) {
      const start = Date.now() - progress * IMAGE_MS;
      timerRef.current = window.setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / IMAGE_MS);
        setProgress(p);
        if (p >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          next();
        }
      }, 50);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, next, onViewed, paused]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  async function del() {
    if (!story || !confirm("Hapus story ini?")) return;
    const res = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Dihapus");
      onClose();
    }
  }

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        {/* progress bars */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
          {group.items.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width:
                    i < si ? "100%" : i === si ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* header */}
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center gap-2 p-3 text-white">
          <Avatar className="h-8 w-8">
            <AvatarImage src={group.image ?? undefined} />
            <AvatarFallback>{initials(group.name ?? group.username)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{group.name ?? group.username}</span>
          <span className="text-xs text-white/70">{timeAgo(story.createdAt)}</span>
          <div className="ml-auto flex items-center gap-2">
            {story.mine && (
              <>
                <button
                  onClick={openViewers}
                  className="flex items-center gap-1 text-xs hover:underline"
                >
                  <Eye className="h-4 w-4" /> {story.views}
                </button>
                <button onClick={del}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* media */}
        <div className="flex flex-1 items-center justify-center">
          {story.mediaType === "video" ? (
            <video
              key={story.id}
              ref={(el) => {
                if (el) {
                  if (paused) el.pause();
                  else el.play().catch(() => {});
                }
              }}
              src={story.mediaUrl}
              className="max-h-full max-w-full"
              autoPlay
              playsInline
              controls={false}
              onEnded={next}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={story.id}
              src={story.mediaUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {story.caption && (
          <p
            className={cn(
              "absolute left-0 right-0 px-6 text-center text-sm text-white drop-shadow",
              story.mine ? "bottom-6" : "bottom-24",
            )}
          >
            {story.caption}
          </p>
        )}

        {/* balas + reaksi (story orang lain) */}
        {!story.mine && (
          <div className="absolute inset-x-0 bottom-0 z-20 space-y-2 p-3">
            <div className="flex justify-center gap-1.5">
              {STORY_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => quickReact(e)}
                  className="text-2xl transition-transform hover:scale-125"
                >
                  {e}
                </button>
              ))}
            </div>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                sendReply();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={reply}
                onChange={(ev) => setReply(ev.target.value)}
                onFocus={() => setReplyFocus(true)}
                onBlur={() => setReplyFocus(false)}
                placeholder={`Balas ${group.name ?? group.username}…`}
                className="h-9 flex-1 rounded-full border border-white/30 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/60"
              />
              <button
                type="submit"
                disabled={!reply.trim()}
                className="rounded-full bg-white/20 p-2 text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* tap zones */}
        <button
          aria-label="Sebelumnya"
          className={cn(
            "absolute left-0 top-16 w-1/3",
            story.mine ? "bottom-0" : "bottom-28",
          )}
          onClick={prev}
        />
        <button
          aria-label="Berikutnya"
          className={cn(
            "absolute right-0 top-16 w-1/3",
            story.mine ? "bottom-0" : "bottom-28",
          )}
          onClick={next}
        />
        <button
          onClick={prev}
          className={cn(
            "absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-1 text-white sm:block",
            gi === 0 && si === 0 && "invisible",
          )}
        >
          <ChevronLeft />
        </button>
        <button
          onClick={next}
          className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-1 text-white sm:block"
        >
          <ChevronRight />
        </button>

        {viewers !== null && (
          <div
            className="absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto rounded-t-2xl bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-semibold">
                Dilihat {viewers.length} orang
              </h4>
              <button onClick={() => setViewers(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewers.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Belum ada yang lihat.
              </p>
            )}
            <div className="space-y-1">
              {viewers.map((v) => (
                <div key={v.username} className="flex items-center gap-3 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={v.image ?? undefined} />
                    <AvatarFallback>{initials(v.name ?? v.username)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm">
                    {v.name ?? v.username}{" "}
                    <span className="text-muted-foreground">@{v.username}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(v.at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
