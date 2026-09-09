"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Quote } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { ReactionBar } from "@/components/forum/reaction-bar";
import { ReportButton } from "@/components/forum/report-button";
import { initials } from "@/lib/utils";
import { tierClass, ROLE_LABEL, ROLE_BADGE } from "@/lib/tier-style";

export function quotePost(author: string, body: string) {
  const quoted = body
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  window.dispatchEvent(
    new CustomEvent("rnb:quote", {
      detail: `**@${author}** menulis:\n${quoted}\n\n`,
    }),
  );
  document.getElementById("reply-anchor")?.scrollIntoView({ behavior: "smooth" });
}

export type PostView = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  author: {
    username: string;
    name: string | null;
    image: string | null;
    role: string;
    tier: string;
  } | null;
  reactionCounts: { emoji: string; count: number }[];
  myReactions: string[];
  isOp: boolean;
  authorIsMe: boolean;
};

export function PostCard({
  post,
  currentUserId,
  canModerate,
  timeAgoLabel,
}: {
  post: PostView;
  currentUserId: string | null;
  canModerate: boolean;
  timeAgoLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(post.body);
  const [busy, setBusy] = React.useState(false);

  async function saveEdit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setEditing(false);
      toast.success("Diperbarui");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Hapus post ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Dihapus");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  if (post.deletedAt) {
    return (
      <div
        id={`post-${post.id}`}
        className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
      >
        Post ini telah dihapus.
      </div>
    );
  }

  const canEdit = post.authorIsMe;
  const canDelete = post.authorIsMe || canModerate;

  return (
    <div id={`post-${post.id}`} className="rounded-xl border p-4">
      <div className="mb-3 flex items-start gap-3">
        <Link href={post.author ? `/u/${post.author.username}` : "#"}>
          <Avatar>
            <AvatarImage src={post.author?.image ?? undefined} />
            <AvatarFallback>
              {initials(post.author?.name ?? post.author?.username)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={post.author ? `/u/${post.author.username}` : "#"}
              className="font-medium hover:underline"
            >
              {post.author?.name ?? post.author?.username ?? "Pengguna dihapus"}
            </Link>
            {post.isOp && <Badge variant="secondary">OP</Badge>}
            {post.author && post.author.role !== "USER" && (
              <Badge className={ROLE_BADGE[post.author.role]}>
                {ROLE_LABEL[post.author.role]}
              </Badge>
            )}
            {post.author && (
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] ${tierClass(post.author.tier)}`}
              >
                {post.author.tier}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgoLabel}
              {post.editedAt && " · disunting"}
            </span>
          </div>
        </div>
        {(canEdit || canDelete) && !editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil /> Sunting
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={remove}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 /> Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <MarkdownEditor value={draft} onChange={setDraft} minHeight={140} />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={busy}>
              Simpan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(post.body);
                setEditing(false);
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <Markdown>{post.body}</Markdown>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ReactionBar
          postId={post.id}
          initialCounts={post.reactionCounts}
          initialMine={post.myReactions}
          canReact={!!currentUserId}
        />
        {currentUserId && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() =>
                quotePost(
                  post.author?.username ?? "pengguna",
                  post.body,
                )
              }
            >
              <Quote className="h-3 w-3" /> Kutip
            </Button>
            {!post.authorIsMe && (
              <ReportButton targetType="post" targetId={post.id} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
