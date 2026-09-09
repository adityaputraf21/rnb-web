"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
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
  const [busy, setBusy] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/statuses/${statusId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setComments((c) => [
        ...c,
        { ...data, createdAt: data.createdAt ?? new Date().toISOString() },
      ]);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setComments((c) => c.filter((x) => x.id !== id));
    await fetch(`/api/statuses/${statusId}/comments/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <Avatar className="h-7 w-7">
            <AvatarImage src={c.author?.image ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {initials(c.author?.name ?? c.author?.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 rounded-lg bg-muted px-3 py-1.5">
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
          {(canModerate || c.author?.username === currentUsername) && (
            <button
              onClick={() => remove(c.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}

      {currentUsername ? (
        <form onSubmit={add} className="flex gap-2">
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
