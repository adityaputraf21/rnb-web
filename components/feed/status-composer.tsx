"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/utils";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { PollComposer, pollPayload, type PollDraft } from "@/components/poll-composer";

export function StatusComposer({
  user,
  onPosted,
}: {
  user: { username: string; name?: string | null; image?: string | null };
  onPosted?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [poll, setPoll] = React.useState<PollDraft | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function addImage(file: File) {
    if (images.length >= 4) return toast.error("Maksimal 4 gambar");
    if (!file.type.startsWith("image/")) return toast.error("Harus gambar");
    if (file.size > MAX_UPLOAD_BYTES)
      return toast.error(`Maks ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setImages((p) => [...p, data.url]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const pp = pollPayload(poll);
    if (!body.trim() && images.length === 0 && !pp)
      return toast.error("Tulis sesuatu, tambah gambar, atau polling");
    setBusy(true);
    try {
      const res = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, images, poll: pp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setBody("");
      setImages([]);
      setPoll(null);
      onPosted?.();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback>{initials(user.name ?? user.username)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Apa yang lagi kamu pikirkan?"
            maxLength={2000}
            className="min-h-[70px] resize-none border-0 px-0 shadow-none focus-visible:ring-0"
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((u) => (
                <div key={u} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt=""
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((x) => x !== u))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <PollComposer value={poll} onChange={setPoll} />

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading || images.length >= 4}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ImagePlus />
              )}
              Foto ({images.length}/4)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addImage(f);
                e.target.value = "";
              }}
            />
            <Button size="sm" disabled={busy || uploading} onClick={submit}>
              {busy ? "Memposting…" : "Posting"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
