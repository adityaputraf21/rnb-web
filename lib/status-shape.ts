import type { StatusView } from "@/components/feed/status-card";
import type { PollData } from "@/components/poll";

import { Prisma } from "@prisma/client";

/** Include Prisma standar untuk membentuk StatusView. */
export function statusInclude(userId?: string) {
  return Prisma.validator<Prisma.StatusInclude>()({
    author: {
      select: {
        username: true,
        name: true,
        image: true,
        role: true,
        tier: true,
      },
    },
    images: { orderBy: { position: "asc" } },
    likes: userId ? { where: { userId }, select: { id: true } } : false,
    reactions: { select: { emoji: true, userId: true } },
    poll: {
      include: {
        options: {
          orderBy: { position: "asc" },
          include: { _count: { select: { votes: true } } },
        },
        votes: { select: { optionId: true, userId: true } },
      },
    },
    _count: { select: { likes: true, comments: true } },
  });
}

type Row = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: Date;
  editedAt: Date | null;
  images: { url: string }[];
  likes?: { id: string }[];
  reactions?: { emoji: string; userId: string }[];
  _count: { likes: number; comments: number };
  author: {
    username: string;
    name: string | null;
    image: string | null;
    role: string;
    tier: string;
  } | null;
  poll?:
    | {
        id: string;
        question: string;
        multiple: boolean;
        closesAt: Date | null;
        options: { id: string; text: string; _count: { votes: number } }[];
        votes?: { optionId: string; userId: string }[];
      }
    | null;
};

export function shapeStatus(
  s: Row,
  me: { id?: string; username: string } | null,
): StatusView {
  const rc = new Map<string, number>();
  const myReactions: string[] = [];
  for (const r of s.reactions ?? []) {
    rc.set(r.emoji, (rc.get(r.emoji) ?? 0) + 1);
    if (me?.id && r.userId === me.id) myReactions.push(r.emoji);
  }

  let poll: PollData | undefined;
  if (s.poll) {
    poll = {
      id: s.poll.id,
      question: s.poll.question,
      multiple: s.poll.multiple,
      closesAt: s.poll.closesAt?.toISOString() ?? null,
      options: s.poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        count: o._count.votes,
      })),
      myVotes: (s.poll.votes ?? [])
        .filter((v) => me?.id && v.userId === me.id)
        .map((v) => v.optionId),
    };
  }

  return {
    id: s.id,
    body: s.body,
    pinned: s.pinned,
    createdAt: s.createdAt.toISOString(),
    editedAt: s.editedAt?.toISOString() ?? null,
    images: s.images.map((i) => i.url),
    likeCount: s._count.likes,
    commentCount: s._count.comments,
    liked: !!s.likes && s.likes.length > 0,
    mine: !!me && s.author?.username === me.username,
    reactionCounts: [...rc].map(([emoji, count]) => ({ emoji, count })),
    myReactions,
    poll,
    author: s.author,
  };
}
