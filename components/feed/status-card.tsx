"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Link2,
  Pin,
  PinOff,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/markdown";
import { MediaGrid } from "@/components/feed/media-grid";
import { CommentSection, type CommentView } from "@/components/feed/comment-section";
import { ReactionBar } from "@/components/reaction-bar";
import { ReportButton } from "@/components/forum/report-button";
import { LinkPreview } from "@/components/link-preview";
import { Poll, type PollData } from "@/components/poll";
import { initials, cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { ROLE_LABEL, ROLE_BADGE, tierClass } from "@/lib/tier-style";
import { firstUrl } from "@/lib/url-util";

export type StatusView = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  editedAt: string | null;
  media: { url: string; type: string; name: string }[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  mine: boolean;
  reactionCounts: { emoji: string; count: number }[];
  myReactions: string[];
  poll?: PollData;
  author: {
    username: string;
    name: string | null;
    image: string | null;
    role: string;
    tier: string;
  } | null;
};

export function StatusCard({
  status,
  currentUsername,
  canModerate,
  comments,
  showComments: showCommentsInitial = false,
}: {
  status: StatusView;
  currentUsername: string | null;
  canModerate: boolean;
  comments?: CommentView[];
  showComments?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(status.liked);
  const [likeCount, setLikeCount] = React.useState(status.likeCount);
  const [pinned, setPinned] = React.useState(status.pinned);
  const [showComments, setShowComments] = React.useState(showCommentsInitial);
  const [loadedComments, setLoadedComments] = React.useState<CommentView[] | null>(
    comments ?? null,
  );
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(status.body);

  const link = firstUrl(status.body);

  async function toggleLike() {
    if (!currentUsername) return toast.error("Masuk dulu");
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    const res = await fetch(`/api/statuses/${status.id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setLikeCount(d.count);
    }
  }

  async function openComments() {
    setShowComments((s) => !s);
    if (loadedComments == null) {
      const res = await fetch(`/api/statuses/${status.id}`);
      setLoadedComments(res.ok ? (await res.json()).comments ?? [] : []);
    }
  }

  async function saveEdit() {
    const res = await fetch(`/api/statuses/${status.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    setEditing(false);
    toast.success("Diperbarui");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Hapus status ini?")) return;
    const res = await fetch(`/api/statuses/${status.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("gagal");
    toast.success("Dihapus");
    router.refresh();
  }

  async function togglePin() {
    const res = await fetch(`/api/statuses/${status.id}/pin`, { method: "POST" });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    setPinned((await res.json()).pinned);
    router.refresh();
  }

  async function block() {
    if (!status.author) return;
    if (!confirm(`Blokir @${status.author.username}? Kamu tidak akan melihat postingannya.`))
      return;
    const res = await fetch(`/api/block/${status.author.username}`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Diblokir");
      router.refresh();
    }
  }

  return (
    <article className="rounded-xl border bg-card p-4">
      {pinned && (
        <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Pin className="h-3 w-3" /> Disematkan
        </p>
      )}
      <div className="flex items-start gap-3">
        <Link href={status.author ? `/u/${status.author.username}` : "#"}>
          <Avatar>
            <AvatarImage src={status.author?.image ?? undefined} />
            <AvatarFallback>
              {initials(status.author?.name ?? status.author?.username)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <Link
              href={status.author ? `/u/${status.author.username}` : "#"}
              className="font-semibold hover:underline"
            >
              {status.author?.name ?? status.author?.username ?? "Pengguna dihapus"}
            </Link>
            {status.author && status.author.role !== "USER" && (
              <Badge className={cn("h-4 px-1 text-[10px]", ROLE_BADGE[status.author.role])}>
                {ROLE_LABEL[status.author.role]}
              </Badge>
            )}
            {status.author && (
              <span className={`rounded border px-1 text-[10px] ${tierClass(status.author.tier)}`}>
                {status.author.tier}
              </span>
            )}
            <Link href={`/feed/${status.id}`} className="text-muted-foreground hover:underline">
              · {timeAgo(status.createdAt)}
              {status.editedAt && " · disunting"}
            </Link>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard?.writeText(`${location.origin}/feed/${status.id}`);
                toast.success("Link disalin");
              }}
            >
              <Link2 /> Salin link
            </DropdownMenuItem>
            {status.mine && (
              <>
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil /> Sunting
                </DropdownMenuItem>
                <DropdownMenuItem onClick={togglePin}>
                  {pinned ? <PinOff /> : <Pin />}
                  {pinned ? "Lepas sematan" : "Sematkan ke profil"}
                </DropdownMenuItem>
              </>
            )}
            {(status.mine || canModerate) && (
              <DropdownMenuItem
                onClick={remove}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 /> Hapus
              </DropdownMenuItem>
            )}
            {currentUsername && !status.mine && status.author && (
              <DropdownMenuItem onClick={block}>
                <Ban /> Blokir @{status.author.username}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-20"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}>
              Simpan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(status.body);
                setEditing(false);
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        status.body && (
          <div className="mt-1.5">
            <Markdown className="prose-sm">{status.body}</Markdown>
          </div>
        )
      )}

      <MediaGrid media={status.media} />
      {link && status.media.length === 0 && <LinkPreview url={link} />}
      {status.poll && <Poll poll={status.poll} loggedIn={!!currentUsername} />}

      <div className="mt-2 flex flex-wrap items-center gap-1 text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5", liked && "text-red-500")}
          onClick={toggleLike}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likeCount > 0 && likeCount}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={openComments}>
          <MessageCircle className="h-4 w-4" />
          {status.commentCount > 0 && status.commentCount}
        </Button>
        <ReactionBar
          endpoint={`/api/statuses/${status.id}/reactions`}
          initialCounts={status.reactionCounts}
          initialMine={status.myReactions}
          canReact={!!currentUsername}
        />
        {currentUsername && !status.mine && (
          <ReportButton targetType="status" targetId={status.id} />
        )}
      </div>

      {showComments && (
        <CommentSection
          statusId={status.id}
          initial={loadedComments ?? []}
          currentUsername={currentUsername}
          canModerate={canModerate}
        />
      )}
    </article>
  );
}
