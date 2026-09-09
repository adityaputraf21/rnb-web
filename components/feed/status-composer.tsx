"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Loader2, X, FileText, Film } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/utils";
import { uploadFile, type Uploaded } from "@/lib/upload-client";
import {
  PollComposer,
  pollPayload,
  type PollDraft,
} from "@/components/poll-composer";

export function StatusComposer({
  user,
  onPosted,
}: {
  user: { username: string; name?: string | null; image?: string | null };
  onPosted?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [media, setMedia] = React.useState<Uploaded[]>([]);
  const [poll, setPoll] = React.useState<PollDraft | null>(null);
  const [uploading, setUploading] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList) {
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        const up = await uploadFile(file, { prefix: "feed" });
        setMedia((m) => [...m, up]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal upload");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function submit() {
    const pp = pollPayload(poll);
    if (!body.trim() && media.length === 0 && !pp)
      return toast.error("Tulis sesuatu, tambah media, atau polling");
    setBusy(true);
    try {
      const res = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          media: media.map((m) => ({
            url: m.url,
            type: m.kind,
            name: m.name,
          })),
          poll: pp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setBody("");
      setMedia([]);
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

          {media.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div key={i} className="relative">
                  {m.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt=""
                      className="h-20 w-20 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border bg-muted p-1 text-center">
                      {m.kind === "video" ? (
                        <Film className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                      <span className="line-clamp-2 text-[9px] leading-tight">
                        {m.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setMedia((p) => p.filter((_, x) => x !== i))
                    }
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
              disabled={uploading > 0}
              onClick={() => fileRef.current?.click()}
            >
              {uploading > 0 ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Paperclip />
              )}
              {uploading > 0
                ? `Mengunggah ${uploading}…`
                : media.length > 0
                  ? `${media.length} media`
                  : "Foto / video / file"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,application/pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button size="sm" disabled={busy || uploading > 0} onClick={submit}>
              {busy ? "Memposting…" : "Posting"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
