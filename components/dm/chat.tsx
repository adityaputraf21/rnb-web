"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, Send, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials, cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { uploadFile } from "@/lib/upload-client";

type Msg = {
  id: string;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  mine: boolean;
  read: boolean;
};

export function Chat({
  other,
  initialMessages,
  canMessage,
}: {
  other: { username: string; name: string | null; image: string | null };
  initialMessages: Msg[];
  canMessage: boolean;
}) {
  const [messages, setMessages] = React.useState<Msg[]>(initialMessages);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

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
          className="flex items-center gap-2 font-medium hover:underline"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={other.image ?? undefined} />
            <AvatarFallback>{initials(other.name ?? other.username)}</AvatarFallback>
          </Avatar>
          {other.name ?? other.username}
        </Link>
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
            className={cn("flex", m.mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3 py-1.5 text-sm",
                m.mine
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted",
              )}
            >
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
                {m.mine && (m.read ? " · dibaca" : " · terkirim")}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {canMessage ? (
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
            accept="image/*,video/*,application/pdf,.zip"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ketik pesan…"
            maxLength={4000}
            className="h-9 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()}>
            <Send />
          </Button>
        </form>
      ) : (
        <p className="border-t p-3 text-center text-sm text-muted-foreground">
          Kamu tidak bisa mengirim pesan ke pengguna ini.
        </p>
      )}
    </div>
  );
}
