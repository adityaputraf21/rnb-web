import { Prisma } from "@prisma/client";
import type { StatusView, StatusCore } from "@/components/feed/status-card";
import type { PollData } from "@/components/poll";

const authorSel = {
  select: { username: true, name: true, image: true, role: true, tier: true },
} as const;

const pollInc = {
  include: {
    options: {
      orderBy: { position: "asc" as const },
      include: { _count: { select: { votes: true } } },
    },
    votes: { select: { optionId: true, userId: true } },
  },
} as const;

/** Include Prisma standar untuk membentuk StatusView. */
export function statusInclude(userId?: string) {
  return Prisma.validator<Prisma.StatusInclude>()({
    author: authorSel,
    images: { orderBy: { position: "asc" } },
    likes: userId ? { where: { userId }, select: { id: true } } : false,
    reactions: { select: { emoji: true, userId: true } },
    bookmarks: userId ? { where: { userId }, select: { id: true } } : false,
    reposts: userId
      ? { where: { authorId: userId }, select: { id: true } }
      : false,
    poll: pollInc,
    repostOf: {
      include: {
        author: authorSel,
        images: { orderBy: { position: "asc" } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        reactions: { select: { emoji: true, userId: true } },
        poll: pollInc,
        _count: { select: { likes: true, comments: true, reposts: true } },
      },
    },
    _count: { select: { likes: true, comments: true, reposts: true } },
  });
}

type Author = {
  username: string;
  name: string | null;
  image: string | null;
  role: string;
  tier: string;
} | null;

type PollRow = {
  id: string;
  question: string;
  multiple: boolean;
  closesAt: Date | null;
  options: { id: string; text: string; _count: { votes: number } }[];
  votes?: { optionId: string; userId: string }[];
} | null;

type Row = {
  id: string;
  body: string;
  pinned?: boolean;
  repostOfId?: string | null;
  createdAt: Date;
  editedAt?: Date | null;
  images?: { url: string; type?: string; name?: string }[];
  likes?: { id: string }[];
  reactions?: { emoji: string; userId: string }[];
  bookmarks?: { id: string }[];
  reposts?: { id: string }[];
  _count?: { likes: number; comments: number; reposts: number };
  author: Author;
  poll?: PollRow;
  repostOf?: (Row & { _count: { likes: number; comments: number; reposts: number } }) | null;
};

function pollFrom(poll: PollRow, me: { id?: string } | null): PollData | undefined {
  if (!poll) return undefined;
  return {
    id: poll.id,
    question: poll.question,
    multiple: poll.multiple,
    closesAt: poll.closesAt?.toISOString() ?? null,
    options: poll.options.map((o) => ({
      id: o.id,
      text: o.text,
      count: o._count.votes,
    })),
    myVotes: (poll.votes ?? [])
      .filter((v) => me?.id && v.userId === me.id)
      .map((v) => v.optionId),
  };
}

function core(s: Row, me: { id?: string; username: string } | null): StatusCore {
  const rc = new Map<string, number>();
  const myReactions: string[] = [];
  for (const r of s.reactions ?? []) {
    rc.set(r.emoji, (rc.get(r.emoji) ?? 0) + 1);
    if (me?.id && r.userId === me.id) myReactions.push(r.emoji);
  }
  return {
    id: s.id,
    body: s.body,
    pinned: !!s.pinned,
    createdAt: s.createdAt.toISOString(),
    editedAt: s.editedAt?.toISOString() ?? null,
    media: (s.images ?? []).map((i) => ({
      url: i.url,
      type: i.type ?? "image",
      name: i.name ?? "",
    })),
    likeCount: s._count?.likes ?? 0,
    commentCount: s._count?.comments ?? 0,
    repostCount: s._count?.reposts ?? 0,
    liked: !!s.likes && s.likes.length > 0,
    bookmarked: !!s.bookmarks && s.bookmarks.length > 0,
    reposted: !!s.reposts && s.reposts.length > 0,
    mine: !!me && s.author?.username === me.username,
    reactionCounts: [...rc].map(([emoji, count]) => ({ emoji, count })),
    myReactions,
    poll: pollFrom(s.poll ?? null, me),
    author: s.author,
  };
}

export function shapeStatus(
  s: Row,
  me: { id?: string; username: string } | null,
): StatusView {
  return {
    ...core(s, me),
    repostedBy: s.repostOfId
      ? { username: s.author?.username ?? "", name: s.author?.name ?? null }
      : null,
    original: s.repostOf ? core(s.repostOf, me) : null,
  };
}
