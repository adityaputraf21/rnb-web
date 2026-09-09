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
  Repeat2,
  Bookmark,
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
import { PeopleDialog } from "@/components/feed/people-dialog";
import { Poll, type PollData } from "@/components/poll";
import { initials, cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { ROLE_LABEL, ROLE_BADGE, tierClass } from "@/lib/tier-style";
import { firstUrl } from "@/lib/url-util";

type Actor = {
  username: string;
  name: string | null;
  image: string | null;
  role: string;
  tier: string;
} | null;

export type StatusCore = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  editedAt: string | null;
  media: { url: string; type: string; name: string }[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  liked: boolean;
  bookmarked: boolean;
  reposted: boolean;
  mine: boolean;
  reactionCounts: { emoji: string; count: number }[];
  myReactions: string[];
  poll?: PollData;
  author: Actor;
};

export type StatusView = StatusCore & {
  repostedBy?: { username: string; name: string | null } | null;
  original?: StatusCore | null;
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
  const hasOriginal = !!status.repostedBy && !!status.original;
  const isQuote = hasOriginal && status.body.trim().length > 0;
  const isRepost = hasOriginal && !isQuote;
  // Quote: aksi & konten = post kutipan itu sendiri. Repost polos = original.
  const s = isRepost ? status.original! : status;
  const quoted = isQuote ? status.original! : null;

  const [showLikers, setShowLikers] = React.useState(false);
  const [showReposters, setShowReposters] = React.useState(false);
  const [liked, setLiked] = React.useState(s.liked);
  const [likeCount, setLikeCount] = React.useState(s.likeCount);
  const [reposted, setReposted] = React.useState(s.reposted);
  const [repostCount, setRepostCount] = React.useState(s.repostCount);
  const [bookmarked, setBookmarked] = React.useState(s.bookmarked);
  const [pinned, setPinned] = React.useState(s.pinned);
  const [showComments, setShowComments] = React.useState(showCommentsInitial);
  const [loadedComments, setLoadedComments] =
    React.useState<CommentView[] | null>(comments ?? null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(s.body);

  const link = firstUrl(s.body);

  async function toggleLike() {
    if (!currentUsername) return toast.error("Masuk dulu");
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    const res = await fetch(`/api/statuses/${s.id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setLikeCount(d.count);
    }
  }

  async function toggleRepost() {
    if (!currentUsername) return toast.error("Masuk dulu");
    const res = await fetch(`/api/statuses/${s.id}/repost`, { method: "POST" });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    const d = await res.json();
    setReposted(d.reposted);
    setRepostCount(d.count);
    toast.success(d.reposted ? "Di-repost ke feed kamu" : "Repost dibatalkan");
    router.refresh();
  }

  async function quote() {
    if (!currentUsername) return toast.error("Masuk dulu");
    const body = prompt("Tulis komentar untuk kutipan ini:");
    if (body == null || !body.trim()) return;
    const res = await fetch(`/api/statuses/${s.id}/repost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    toast.success("Dikutip ke feed kamu");
    router.refresh();
  }

  async function toggleBookmark() {
    if (!currentUsername) return toast.error("Masuk dulu");
    setBookmarked((v) => !v);
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId: s.id }),
    });
    if (res.ok) setBookmarked((await res.json()).bookmarked);
  }

  async function openComments() {
    setShowComments((v) => !v);
    if (loadedComments == null) {
      const res = await fetch(`/api/statuses/${s.id}`);
      setLoadedComments(res.ok ? (await res.json()).comments ?? [] : []);
    }
  }

  async function saveEdit() {
    const res = await fetch(`/api/statuses/${s.id}`, {
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
    // kalau ini repost milikku -> batal repost; kalau bukan -> hapus status
    if (isRepost && status.repostedBy?.username === currentUsername) {
      return toggleRepost();
    }
    if (!confirm("Hapus status ini?")) return;
    const res = await fetch(`/api/statuses/${s.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("gagal");
    toast.success("Dihapus");
    router.refresh();
  }

  async function togglePin() {
    const res = await fetch(`/api/statuses/${s.id}/pin`, { method: "POST" });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    setPinned((await res.json()).pinned);
    router.refresh();
  }

  async function block() {
    if (!s.author) return;
    if (!confirm(`Blokir @${s.author.username}?`)) return;
    const res = await fetch(`/api/block/${s.author.username}`, { method: "POST" });
    if (res.ok) {
      toast.success("Diblokir");
      router.refresh();
    }
  }

  const canEdit = s.mine && !isRepost;
  const canDelete =
    s.mine || canModerate || (isRepost && status.repostedBy?.username === currentUsername);

  return (
    <article className="rounded-xl border bg-card p-4">
      {isRepost && (
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Repeat2 className="h-3.5 w-3.5" />
          <Link
            href={`/u/${status.repostedBy!.username}`}
            className="hover:underline"
          >
            {status.repostedBy!.name ?? status.repostedBy!.username}
          </Link>{" "}
          me-repost
        </p>
      )}
      {pinned && !isRepost && (
        <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Pin className="h-3 w-3" /> Disematkan
        </p>
      )}

      <div className="flex items-start gap-3">
        <Link href={s.author ? `/u/${s.author.username}` : "#"}>
          <Avatar>
            <AvatarImage src={s.author?.image ?? undefined} />
            <AvatarFallback>
              {initials(s.author?.name ?? s.author?.username)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <Link
              href={s.author ? `/u/${s.author.username}` : "#"}
              className="font-semibold hover:underline"
            >
              {s.author?.name ?? s.author?.username ?? "Pengguna dihapus"}
            </Link>
            {s.author && s.author.role !== "USER" && (
              <Badge className={cn("h-4 px-1 text-[10px]", ROLE_BADGE[s.author.role])}>
                {ROLE_LABEL[s.author.role]}
              </Badge>
            )}
            {s.author && (
              <span className={`rounded border px-1 text-[10px] ${tierClass(s.author.tier)}`}>
                {s.author.tier}
              </span>
            )}
            <Link href={`/feed/${s.id}`} className="text-muted-foreground hover:underline">
              · {timeAgo(s.createdAt)}
              {s.editedAt && " · disunting"}
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
                navigator.clipboard?.writeText(`${location.origin}/feed/${s.id}`);
                toast.success("Link disalin");
              }}
            >
              <Link2 /> Salin link
            </DropdownMenuItem>
            {canEdit && (
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
            {canDelete && (
              <DropdownMenuItem
                onClick={remove}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 />{" "}
                {isRepost && status.repostedBy?.username === currentUsername
                  ? "Batal repost"
                  : "Hapus"}
              </DropdownMenuItem>
            )}
            {currentUsername && !s.mine && s.author && (
              <DropdownMenuItem onClick={block}>
                <Ban /> Blokir @{s.author.username}
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
                setDraft(s.body);
                setEditing(false);
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        s.body && (
          <div className="mt-1.5">
            <Markdown className="prose-sm">{s.body}</Markdown>
          </div>
        )
      )}

      <MediaGrid media={s.media} />
      {link && s.media.length === 0 && !quoted && <LinkPreview url={link} />}
      {s.poll && <Poll poll={s.poll} loggedIn={!!currentUsername} />}

      {quoted && (
        <Link
          href={`/feed/${quoted.id}`}
          className="mt-2 block rounded-xl border p-3 hover:bg-accent/40"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold">
              {quoted.author?.name ?? quoted.author?.username ?? "Pengguna dihapus"}
            </span>
            <span className="text-muted-foreground">
              @{quoted.author?.username} · {timeAgo(quoted.createdAt)}
            </span>
          </div>
          {quoted.body && (
            <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-sm">
              {quoted.body}
            </p>
          )}
          {quoted.media.length > 0 && (
            <MediaGrid media={quoted.media.slice(0, 2)} />
          )}
        </Link>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1 text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5", liked && "text-red-500")}
          onClick={toggleLike}
          onDoubleClick={() => likeCount > 0 && setShowLikers(true)}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likeCount > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowLikers(true);
              }}
            >
              {likeCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={openComments}>
          <MessageCircle className="h-4 w-4" />
          {s.commentCount > 0 && s.commentCount}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1.5", reposted && "text-green-500")}
            >
              <Repeat2 className="h-4 w-4" />
              {repostCount > 0 && repostCount}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={toggleRepost}>
              <Repeat2 /> {reposted ? "Batal repost" : "Repost"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={quote}>
              <Pencil /> Kutip
            </DropdownMenuItem>
            {repostCount > 0 && (
              <DropdownMenuItem onClick={() => setShowReposters(true)}>
                Lihat yang repost
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          className={cn(bookmarked && "text-primary")}
          onClick={toggleBookmark}
        >
          <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        </Button>
        <ReactionBar
          endpoint={`/api/statuses/${s.id}/reactions`}
          initialCounts={s.reactionCounts}
          initialMine={s.myReactions}
          canReact={!!currentUsername}
        />
        {currentUsername && !s.mine && (
          <ReportButton targetType="status" targetId={s.id} />
        )}
      </div>

      {showComments && (
        <CommentSection
          statusId={s.id}
          initial={loadedComments ?? []}
          currentUsername={currentUsername}
          canModerate={canModerate}
        />
      )}

      <PeopleDialog
        open={showLikers}
        onOpenChange={setShowLikers}
        title="Disukai oleh"
        fetchUrl={`/api/statuses/${s.id}/likers?type=like`}
      />
      <PeopleDialog
        open={showReposters}
        onOpenChange={setShowReposters}
        title="Di-repost oleh"
        fetchUrl={`/api/statuses/${s.id}/likers?type=repost`}
      />
    </article>
  );
}
