import Link from "next/link";
import { notFound } from "next/navigation";
import { Pin, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard, type PostView } from "@/components/forum/post-card";
import { ReplyForm } from "@/components/forum/reply-form";
import { ThreadModActions } from "@/components/forum/thread-mod-actions";
import { ThreadToolbar } from "@/components/forum/thread-toolbar";
import { Poll } from "@/components/poll";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ thread: string }>;
}) {
  const { thread } = await params;
  const t = await prisma.thread.findUnique({ where: { slug: thread } });
  return { title: t?.title ?? "Thread" };
}

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; thread: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category: catSlug, thread: threadSlug } = await params;
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const thread = await prisma.thread.findUnique({
    where: { slug: threadSlug },
    include: { category: true, author: { select: { username: true } } },
  });
  if (!thread || thread.deletedAt || thread.category.slug !== catSlug) {
    notFound();
  }

  const user = await getCurrentUser();
  const canModerate = hasRole(user, "MODERATOR");

  const [bookmark, subscription, allCategories] = await Promise.all([
    user
      ? prisma.bookmark.findUnique({
          where: { userId_threadId: { userId: user.id, threadId: thread.id } },
        })
      : null,
    user
      ? prisma.threadSubscription.findUnique({
          where: { userId_threadId: { userId: user.id, threadId: thread.id } },
        })
      : null,
    canModerate
      ? prisma.category.findMany({
          orderBy: { position: "asc" },
          select: { id: true, name: true },
        })
      : [],
  ]);

  // hitung view (tidak menunggu)
  prisma.thread
    .update({ where: { id: thread.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  const totalPosts = await prisma.post.count({ where: { threadId: thread.id } });
  const pages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));

  const posts = await prisma.post.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    skip: (pageNum - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          role: true,
          tier: true,
        },
      },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  const firstPostId = (
    await prisma.post.findFirst({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
  )?.id;

  const views: (PostView & { key: string })[] = posts.map((p) => {
    const countMap = new Map<string, number>();
    const mine: string[] = [];
    for (const r of p.reactions) {
      countMap.set(r.emoji, (countMap.get(r.emoji) ?? 0) + 1);
      if (user && r.userId === user.id) mine.push(r.emoji);
    }
    return {
      key: p.id,
      id: p.id,
      body: p.body,
      createdAt: p.createdAt.toISOString(),
      editedAt: p.editedAt?.toISOString() ?? null,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      author: p.author
        ? {
            username: p.author.username,
            name: p.author.name,
            image: p.author.image,
            role: p.author.role,
            tier: p.author.tier,
          }
        : null,
      reactionCounts: [...countMap].map(([emoji, count]) => ({ emoji, count })),
      myReactions: mine,
      isOp: p.id === firstPostId,
      authorIsMe: !!user && p.author?.id === user.id,
      isBest: p.id === thread.bestPostId,
    };
  });

  const canMarkBest =
    !!user && (canModerate || thread.authorId === user.id);

  const poll = await prisma.poll
    .findUnique({
      where: { threadId: thread.id },
      include: {
        options: {
          orderBy: { position: "asc" },
          include: { _count: { select: { votes: true } } },
        },
        votes: { select: { optionId: true, userId: true } },
      },
    })
    .catch(() => null);
  const pollData = poll
    ? {
        id: poll.id,
        question: poll.question,
        multiple: poll.multiple,
        closesAt: poll.closesAt?.toISOString() ?? null,
        options: poll.options.map((o) => ({
          id: o.id,
          text: o.text,
          count: o._count.votes,
        })),
        myVotes: poll.votes
          .filter((v) => user && v.userId === user.id)
          .map((v) => v.optionId),
      }
    : null;

  const muted = !!user?.mutedUntil && new Date(user.mutedUntil) > new Date();
  const canReply = !!user && !muted && (!thread.locked || canModerate);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link href="/forum" className="hover:underline">
            Forum
          </Link>{" "}
          /{" "}
          <Link
            href={`/forum/${thread.category.slug}`}
            className="hover:underline"
          >
            {thread.category.name}
          </Link>
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {thread.pinned && <Pin className="h-4 w-4 text-primary" />}
            {thread.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
            {thread.title}
          </h1>
          <ThreadModActions
            threadId={thread.id}
            categorySlug={thread.category.slug}
            currentCategoryId={thread.categoryId}
            categories={allCategories}
            pinned={thread.pinned}
            locked={thread.locked}
            canModerate={canModerate}
            canDelete={canModerate || thread.author?.username === user?.username}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {totalPosts} post · {thread.views} dilihat · dibuat{" "}
          {timeAgo(thread.createdAt)}
        </p>
      </div>

      <ThreadToolbar
        threadId={thread.id}
        initialBookmarked={!!bookmark}
        initialSubscribed={!!subscription}
        loggedIn={!!user}
      />

      {pollData && pageNum === 1 && (
        <Poll poll={pollData} loggedIn={!!user} />
      )}

      <div className="space-y-3">
        {views.map((v) => (
          <PostCard
            key={v.key}
            post={v}
            currentUserId={user?.id ?? null}
            canModerate={canModerate}
            timeAgoLabel={timeAgo(v.createdAt)}
            threadId={thread.id}
            canMarkBest={canMarkBest}
          />
        ))}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === pageNum ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link
                href={`/forum/${thread.category.slug}/${thread.slug}?page=${p}`}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {pageNum === pages && (
        <div className="pt-2">
          {canReply ? (
            <ReplyForm threadId={thread.id} />
          ) : muted ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Kamu sedang di-timeout dan tidak bisa membalas untuk sementara.
            </p>
          ) : thread.locked ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <Lock className="mr-1 inline h-4 w-4" />
              Thread ini dikunci.
            </p>
          ) : (
            <Button variant="outline" asChild>
              <Link
                href={`/login?callbackUrl=/forum/${thread.category.slug}/${thread.slug}`}
              >
                Masuk untuk membalas
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
