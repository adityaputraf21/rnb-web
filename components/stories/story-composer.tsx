"use client";

import * as React from "react";
import { X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/upload-client";

export function StoryComposer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [media, setMedia] = React.useState<{ url: string; type: string } | null>(
    null,
  );
  const [caption, setCaption] = React.useState("");
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
    if (!media) return;
    setBusy(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: media.url,
          mediaType: media.type,
          caption,
        }),
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

        {media ? (
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

        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (opsional)"
          maxLength={200}
          className="mt-3"
        />
        <Button
          className="mt-3 w-full"
          disabled={!media || busy || uploading}
          onClick={submit}
        >
          {busy ? "Memposting…" : "Bagikan ke Story"}
        </Button>
      </div>
    </div>
  );
}
