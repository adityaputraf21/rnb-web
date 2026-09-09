"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Loader2,
  FileText,
  Pencil,
  Trash2,
  Check,
  X,
  MoreVertical,
  BellOff,
  Bell,
  SmilePlus,
  Mic,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials, cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { uploadFile } from "@/lib/upload-client";
import { GifPicker } from "@/components/gif-picker";
import { EmojiPicker } from "@/components/emoji-picker";

const DM_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢", "🙏"];

type Reaction = { emoji: string; mine: boolean };
type Msg = {
  id: string;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  mine: boolean;
  read: boolean;
  edited: boolean;
  deleted: boolean;
  reactions: Reaction[];
};

export function Chat({
  other,
  initialMessages,
  initialMuted,
  canMessage,
}: {
  other: { username: string; name: string | null; image: string | null };
  initialMessages: Msg[];
  initialMuted: boolean;
  canMessage: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Msg[]>(initialMessages);
  const [muted, setMuted] = React.useState(initialMuted);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const [reactFor, setReactFor] = React.useState<string | null>(null);
  const [otherTyping, setOtherTyping] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [recSecs, setRecSecs] = React.useState(0);
  const endRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const lastTypingRef = React.useRef(0);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const recTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const pingTyping = React.useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;
    fetch(`/api/messages/${other.username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "typing" }),
    }).catch(() => {});
  }, [other.username]);

  async function convAction(action: string) {
    const res = await fetch(`/api/messages/${other.username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return toast.error("gagal");
    if (action === "mute") setMuted(true);
    if (action === "unmute") setMuted(false);
    if (action === "clear") {
      setMessages([]);
      toast.success("Chat dibersihkan");
    }
    router.refresh();
  }

  async function react(id: string, emoji: string) {
    setReactFor(null);
    const res = await fetch(`/api/dm/${id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessages((m) =>
        m.map((x) => (x.id === id ? { ...x, reactions: d.reactions } : x)),
      );
    }
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/dm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editText }),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    setMessages((m) =>
      m.map((x) =>
        x.id === id ? { ...x, body: editText.trim(), edited: true } : x,
      ),
    );
    setEditId(null);
  }

  async function del(id: string) {
    if (!confirm("Hapus pesan ini?")) return;
    const res = await fetch(`/api/dm/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("gagal");
    setMessages((m) =>
      m.map((x) =>
        x.id === id
          ? { ...x, deleted: true, body: "", mediaUrl: null, mediaType: null }
          : x,
      ),
    );
  }

  const scrollDown = React.useCallback(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, []);

  React.useEffect(() => {
    scrollDown();
  }, [scrollDown]);

  React.useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/messages/${other.username}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setOtherTyping(!!data.otherTyping);
          setMessages((prev) => {
            if (data.messages.length !== prev.length) {
              requestAnimationFrame(scrollDown);
              return data.messages;
            }
            return prev;
          });
        }
      } catch {
        /* ignore */
      }
    };
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [other.username, scrollDown]);

  async function send(bodyText: string, media?: { url: string; type: string }) {
    if (!bodyText.trim() && !media) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${other.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: bodyText,
          mediaUrl: media?.url,
          mediaType: media?.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setMessages((m) => [...m, data]);
      setText("");
      requestAnimationFrame(scrollDown);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setSending(false);
    }
  }

  async function onFile(file: File) {
    setUploading(true);
    try {
      const up = await uploadFile(file, { prefix: `dm` });
      await send("", { url: up.url, type: up.kind });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 800) return;
        const file = new File([blob], `voice-${Date.now()}.${mime.includes("webm") ? "webm" : "mp4"}`, {
          type: mime,
        });
        setUploading(true);
        try {
          const up = await uploadFile(file, { prefix: "dm" });
          await send("", { url: up.url, type: "audio" });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Gagal kirim voice");
        } finally {
          setUploading(false);
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSecs(0);
      recTimerRef.current = setInterval(() => {
        setRecSecs((s) => {
          if (s >= 120) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Tidak bisa mengakses mikrofon");
    }
  }

  function stopRecording() {
    recRef.current?.state === "recording" && recRef.current.stop();
  }

  function cancelRecording() {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    chunksRef.current = [];
    const rec = recRef.current;
    if (rec && rec.state === "recording") {
      rec.onstop = () => rec.stream.getTracks().forEach((t) => t.stop());
      rec.stop();
    }
    setRecording(false);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border">
      <div className="flex items-center gap-3 border-b p-3">
        <Button variant="ghost" size="icon" className="sm:hidden" asChild>
          <Link href="/messages">
            <ArrowLeft />
          </Link>
        </Button>
        <Link
          href={`/u/${other.username}`}
          className="flex flex-1 items-center gap-2 font-medium hover:underline"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={other.image ?? undefined} />
            <AvatarFallback>{initials(other.name ?? other.username)}</AvatarFallback>
          </Avatar>
          {other.name ?? other.username}
          {muted && <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => convAction(muted ? "unmute" : "mute")}>
              {muted ? <Bell /> : <BellOff />}
              {muted ? "Bunyikan notifikasi" : "Bisukan notifikasi"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (confirm("Bersihkan semua pesan dari sisi kamu?"))
                  convAction("clear");
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 /> Bersihkan chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Mulai percakapan dengan {other.name ?? other.username}.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "group flex items-center gap-1",
              m.mine ? "justify-end" : "justify-start",
            )}
          >
            {m.mine && !m.deleted && editId !== m.id && (
              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                {m.body && (
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditId(m.id);
                      setEditText(m.body);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  className="p-1 text-muted-foreground hover:text-destructive"
                  onClick={() => del(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3 py-1.5 text-sm",
                m.deleted
                  ? "border bg-transparent italic text-muted-foreground"
                  : m.mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted",
              )}
            >
              {m.deleted ? (
                <p>Pesan ini dihapus</p>
              ) : editId === m.id ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(m.id);
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="w-48 rounded bg-white/20 px-2 py-0.5 text-sm outline-none"
                  />
                  <button onClick={() => saveEdit(m.id)}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditId(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
              {m.mediaUrl &&
                (m.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.mediaUrl}
                    alt=""
                    className="mb-1 max-h-64 rounded-lg"
                  />
                ) : m.mediaType === "video" ? (
                  <video src={m.mediaUrl} controls className="mb-1 max-h-64 rounded-lg" />
                ) : m.mediaType === "audio" ? (
                  <audio src={m.mediaUrl} controls className="mb-1 h-10 w-56 max-w-full" />
                ) : (
                  <a
                    href={m.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-1 flex items-center gap-1 underline"
                  >
                    <FileText className="h-4 w-4" /> Lampiran
                  </a>
                ))}
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
              <p
                className={cn(
                  "mt-0.5 text-[10px]",
                  m.mine
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
              >
                {timeAgo(m.createdAt)}
                {m.edited && " · disunting"}
                {m.mine && (m.read ? " · dibaca" : " · terkirim")}
              </p>
                </>
              )}
            </div>

            {!m.deleted && (
              <div className="relative flex items-center">
                <button
                  className="p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  onClick={() => setReactFor(reactFor === m.id ? null : m.id)}
                >
                  <SmilePlus className="h-3.5 w-3.5" />
                </button>
                {reactFor === m.id && (
                  <div className="absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full border bg-popover p-1 shadow-md">
                    {DM_EMOJIS.map((e) => (
                      <button
                        key={e}
                        className="rounded p-0.5 text-base hover:bg-accent"
                        onClick={() => react(m.id, e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {m.reactions.length > 0 && (
              <div
                className={cn(
                  "flex gap-0.5",
                  m.mine ? "order-first" : "",
                )}
              >
                {m.reactions.map((r, ri) => (
                  <button
                    key={ri}
                    onClick={() => react(m.id, r.emoji)}
                    className={cn(
                      "rounded-full border px-1 text-xs",
                      r.mine && "border-primary bg-primary/10",
                    )}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {otherTyping && (
        <p className="px-4 pb-1 text-xs italic text-muted-foreground">
          {other.name ?? other.username} sedang mengetik…
        </p>
      )}

      {canMessage ? (
        recording ? (
          <div className="flex items-center gap-3 border-t p-2">
            <span className="flex items-center gap-2 text-sm text-destructive">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
              Merekam {Math.floor(recSecs / 60)}:
              {String(recSecs % 60).padStart(2, "0")}
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
              >
                Batal
              </Button>
              <Button type="button" size="sm" onClick={stopRecording}>
                <Square className="h-4 w-4" /> Kirim
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-center gap-2 border-t p-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf,.zip"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <GifPicker
              onPick={(url) => send("", { url, type: "image" })}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-xs font-bold"
                >
                  GIF
                </Button>
              }
            />
            <EmojiPicker
              onPick={(e) => setText((t) => t + e)}
              trigger={
                <Button type="button" variant="ghost" size="icon">
                  <span className="text-base">😊</span>
                </Button>
              }
            />
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                pingTyping();
              }}
              placeholder="Ketik pesan…"
              maxLength={4000}
              className="h-9 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {text.trim() ? (
              <Button type="submit" size="icon" disabled={sending}>
                <Send />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={uploading}
                onClick={startRecording}
              >
                <Mic />
              </Button>
            )}
          </form>
        )
      ) : (
        <p className="border-t p-3 text-center text-sm text-muted-foreground">
          Kamu tidak bisa mengirim pesan ke pengguna ini.
        </p>
      )}
    </div>
  );
}
