"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, Reply } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export type CommentView = {
  id: string;
  body: string;
  createdAt: string;
  parentId?: string | null;
  author: { username: string; name: string | null; image: string | null } | null;
};

export function CommentSection({
  statusId,
  initial,
  currentUsername,
  canModerate,
}: {
  statusId: string;
  initial: CommentView[];
  currentUsername: string | null;
  canModerate: boolean;
}) {
  const [comments, setComments] = React.useState<CommentView[]>(initial);
  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  async function send(body: string, parentId: string | null) {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/statuses/${statusId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setComments((c) => [
        ...c,
        { ...data, createdAt: data.createdAt ?? new Date().toISOString() },
      ]);
      if (parentId) {
        setReplyTo(null);
        setReplyText("");
      } else {
        setText("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setComments((c) => c.filter((x) => x.id !== id && x.parentId !== id));
    await fetch(`/api/statuses/${statusId}/comments/${id}`, { method: "DELETE" });
  }

  function Row({ c, isReply }: { c: CommentView; isReply?: boolean }) {
    return (
      <div className={isReply ? "ml-9" : ""}>
        <div className="flex gap-2 text-sm">
          <Avatar className="h-7 w-7">
            <AvatarImage src={c.author?.image ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {initials(c.author?.name ?? c.author?.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="rounded-lg bg-muted px-3 py-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={c.author ? `/u/${c.author.username}` : "#"}
                  className="font-medium hover:underline"
                >
                  {c.author?.name ?? c.author?.username ?? "?"}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(c.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{c.body}</p>
            </div>
            <div className="mt-0.5 flex gap-3 pl-1 text-xs text-muted-foreground">
              {currentUsername && !isReply && (
                <button
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Reply className="h-3 w-3" /> Balas
                </button>
              )}
              {(canModerate || c.author?.username === currentUsername) && (
                <button
                  onClick={() => remove(c.id)}
                  className="flex items-center gap-1 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Hapus
                </button>
              )}
            </div>
            {replyTo === c.id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(replyText, c.id);
                }}
                className="mt-1 flex gap-2"
              >
                <Input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Balas ${c.author?.username ?? ""}…`}
                  maxLength={1000}
                />
                <Button type="submit" size="sm" disabled={busy}>
                  Kirim
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {roots.map((c) => (
        <div key={c.id} className="space-y-2">
          <Row c={c} />
          {repliesOf(c.id).map((r) => (
            <Row key={r.id} c={r} isReply />
          ))}
        </div>
      ))}

      {currentUsername ? (
        <form onSubmit={(e) => { e.preventDefault(); send(text, null); }} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis komentar…"
            maxLength={1000}
          />
          <Button type="submit" size="sm" disabled={busy}>
            Kirim
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">Masuk untuk berkomentar.</p>
      )}
    </div>
  );
}
