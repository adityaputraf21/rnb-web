import type { StatusView } from "@/components/feed/status-card";

type Row = {
  id: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  images: { url: string }[];
  likes?: { id: string }[];
  _count: { likes: number; comments: number };
  author: {
    username: string;
    name: string | null;
    image: string | null;
    role: string;
    tier: string;
  } | null;
};

export function shapeStatus(
  s: Row,
  me: { username: string } | null,
): StatusView {
  return {
    id: s.id,
    body: s.body,
    createdAt: s.createdAt.toISOString(),
    editedAt: s.editedAt?.toISOString() ?? null,
    images: s.images.map((i) => i.url),
    likeCount: s._count.likes,
    commentCount: s._count.comments,
    liked: !!s.likes && s.likes.length > 0,
    mine: !!me && s.author?.username === me.username,
    author: s.author,
  };
}
