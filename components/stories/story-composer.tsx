"use client";

import * as React from "react";
import { X, Loader2, ImagePlus, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

const BG = ["#5865F2", "#EB459E", "#57F287", "#FEE75C", "#ED4245", "#1e1f22"];

export function StoryComposer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = React.useState<"media" | "text">("media");
  const [media, setMedia] = React.useState<{ url: string; type: string } | null>(
    null,
  );
  const [caption, setCaption] = React.useState("");
  const [text, setText] = React.useState("");
  const [bg, setBg] = React.useState(BG[0]);
  const [audience, setAudience] = React.useState<"all" | "close">("all");
  const [pollQ, setPollQ] = React.useState("");
  const [pollOpts, setPollOpts] = React.useState(["", ""]);
  const [showPoll, setShowPoll] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function pick(file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
      return toast.error("Hanya gambar atau video");
    setUploading(true);
    try {
      const up = await uploadFile(file, { prefix: "story" });
      setMedia({ url: up.url, type: up.kind });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      const pollPayload =
        showPoll && pollQ.trim() && pollOpts.filter((o) => o.trim()).length >= 2
          ? { question: pollQ, options: pollOpts.filter((o) => o.trim()) }
          : undefined;
      const payload =
        mode === "text"
          ? {
              mediaType: "text",
              caption: text,
              bgColor: bg,
              audience,
              poll: pollPayload,
            }
          : {
              mediaUrl: media?.url,
              mediaType: media?.type,
              caption,
              audience,
              poll: pollPayload,
            };
      if (mode === "text" && !text.trim()) {
        setBusy(false);
        return toast.error("Tulis sesuatu");
      }
      if (mode === "media" && !media) {
        setBusy(false);
        return toast.error("Pilih media");
      }
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Story diposting (hilang setelah 24 jam)");
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Story baru</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="mb-3 flex gap-1">
          <Button
            size="sm"
            variant={mode === "media" ? "secondary" : "ghost"}
            onClick={() => setMode("media")}
          >
            <ImagePlus /> Media
          </Button>
          <Button
            size="sm"
            variant={mode === "text" ? "secondary" : "ghost"}
            onClick={() => setMode("text")}
          >
            <Type /> Teks
          </Button>
        </div>

        {mode === "text" ? (
          <div className="space-y-2">
            <div
              className="flex min-h-40 items-center justify-center rounded-xl p-4"
              style={{ background: bg }}
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tulis sesuatu…"
                maxLength={280}
                className="resize-none border-0 bg-transparent text-center text-lg font-semibold text-white placeholder:text-white/60 focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-1.5">
              {BG.map((c) => (
                <button
                  key={c}
                  onClick={() => setBg(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2",
                    bg === c ? "border-foreground" : "border-transparent",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        ) : media ? (
          <div className="relative overflow-hidden rounded-xl bg-black">
            {media.type === "video" ? (
              <video src={media.url} className="max-h-[50vh] w-full" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.url} alt="" className="max-h-[50vh] w-full object-contain" />
            )}
            <button
              onClick={() => setMedia(null)}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-accent/50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            {uploading ? "Mengunggah…" : "Pilih gambar / video"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = "";
          }}
        />

        {mode === "media" && (
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (opsional)"
            maxLength={200}
            className="mt-3"
          />
        )}

        <div className="mt-3 flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={audience === "all" ? "secondary" : "ghost"}
            onClick={() => setAudience("all")}
          >
            Semua
          </Button>
          <Button
            type="button"
            size="sm"
            variant={audience === "close" ? "secondary" : "ghost"}
            onClick={() => setAudience("close")}
          >
            ⭐ Close friends
          </Button>
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPoll((v) => !v)}
            className="text-sm text-primary hover:underline"
          >
            {showPoll ? "− Hapus polling" : "+ Tambah polling"}
          </button>
          {showPoll && (
            <div className="mt-2 space-y-1.5">
              <Input
                value={pollQ}
                onChange={(e) => setPollQ(e.target.value)}
                placeholder="Pertanyaan polling"
                maxLength={120}
              />
              {pollOpts.map((o, i) => (
                <Input
                  key={i}
                  value={o}
                  onChange={(e) =>
                    setPollOpts((p) =>
                      p.map((x, xi) => (xi === i ? e.target.value : x)),
                    )
                  }
                  placeholder={`Opsi ${i + 1}`}
                  maxLength={60}
                />
              ))}
              {pollOpts.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOpts((p) => [...p, ""])}
                  className="text-xs text-primary hover:underline"
                >
                  + Opsi
                </button>
              )}
            </div>
          )}
        </div>

        <Button
          className="mt-3 w-full"
          disabled={busy || uploading}
          onClick={submit}
        >
          {busy ? "Memposting…" : "Bagikan ke Story"}
        </Button>
      </div>
    </div>
  );
}
