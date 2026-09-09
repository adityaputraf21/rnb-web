import Link from "next/link";
import {
  MessagesSquare,
  Trophy,
  CalendarDays,
  Megaphone,
  ArrowRight,
  Bell,
  Bookmark,
  PlusCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInButton } from "@/components/sign-in-button";
import { timeAgo } from "@/lib/format";
import { tierClass } from "@/lib/tier-style";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: MessagesSquare, title: "Forum diskusi", desc: "Thread & balasan dengan markdown, gambar, mention, dan reaksi." },
  { icon: Trophy, title: "Leaderboard", desc: "Kumpulkan poin dari aktivitas, naik tier dari Bronze sampai Legend." },
  { icon: CalendarDays, title: "Event", desc: "Agenda komunitas, otomatis diumumkan ke Discord." },
  { icon: Megaphone, title: "Pengumuman", desc: "Info penting dari tim, lewat web atau slash command Discord." },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  /* ---------------- Belum login: halaman marketing ---------------- */
  if (!user) {
    const [memberCount, threadCount] = await Promise.all([
      prisma.user.count(),
      prisma.thread.count({ where: { deletedAt: null } }),
    ]).catch(() => [0, 0]);

    return (
      <div className="space-y-16">
        <section className="flex flex-col items-center gap-6 py-16 text-center">
          <Badge variant="secondary" className="gap-1">
            <span className="text-primary">●</span> Rise Never Break
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Rumah diskusi komunitas RnB
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Forum, event, leaderboard, dan pengumuman dalam satu tempat —
            tersambung langsung ke server Discord.
          </p>
          <SignInButton size="lg" callbackUrl="/forum" />
          <p className="text-sm text-muted-foreground">
            {memberCount} member · {threadCount} thread · masuk pakai Discord
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-5">
                <f.icon className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">Ikut diskusi sekarang</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Login sekali pakai akun Discord, langsung bisa bikin thread, balas,
            dan naik leaderboard.
          </p>
          <div className="mt-4">
            <SignInButton callbackUrl="/forum" />
          </div>
        </section>
      </div>
    );
  }

  /* ---------------- Sudah login: dashboard ---------------- */
  const [threads, topUsers, unread, bookmarks, following] = await Promise.all([
    prisma.thread.findMany({
      where: { deletedAt: null },
      orderBy: { lastPostAt: "desc" },
      take: 6,
      include: {
        category: true,
        author: { select: { username: true, name: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.user.findMany({
      where: { bannedAt: null },
      orderBy: { points: "desc" },
      take: 5,
      select: { username: true, name: true, points: true, tier: true },
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.threadSubscription.findMany({
      where: { userId: user.id, thread: { deletedAt: null } },
      orderBy: { thread: { lastPostAt: "desc" } },
      take: 4,
      include: { thread: { include: { category: true } } },
    }),
  ]).catch(() => [[], [], 0, 0, []] as const);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Halo, {user.name ?? user.username} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.tier} · {user.points} poin
          </p>
        </div>
        <Button asChild>
          <Link href="/forum">
            <PlusCircle /> Ke Forum
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/notifications" className="contents">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold">{unread}</p>
                <p className="text-xs text-muted-foreground">notifikasi</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/bookmarks" className="contents">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <Bookmark className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold">{bookmarks}</p>
                <p className="text-xs text-muted-foreground">bookmark</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/leaderboard" className="contents">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold">{user.points}</p>
                <p className="text-xs text-muted-foreground">poin kamu</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/u/${user.username}`} className="contents">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <MessagesSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold">{user.tier}</p>
                <p className="text-xs text-muted-foreground">tier</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {following.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Thread yang kamu ikuti</h2>
          <div className="divide-y rounded-xl border">
            {following.map((s) => (
              <Link
                key={s.id}
                href={`/forum/${s.thread.category.slug}/${s.thread.slug}`}
                className="flex items-center justify-between gap-4 p-3 hover:bg-accent/50"
              >
                <span className="truncate font-medium">{s.thread.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(s.thread.lastPostAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Diskusi terbaru</h2>
            <Button variant="link" size="sm" asChild>
              <Link href="/forum">
                Semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="divide-y rounded-xl border">
            {threads.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">
                Belum ada thread. Jadilah yang pertama!
              </p>
            )}
            {threads.map((t) => (
              <Link
                key={t.id}
                href={`/forum/${t.category.slug}/${t.slug}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category.name} ·{" "}
                    {t.author?.name ?? t.author?.username ?? "?"} ·{" "}
                    {timeAgo(t.lastPostAt)}
                  </p>
                </div>
                <Badge variant="secondary">{t._count.posts} pos</Badge>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Top member</h2>
          <div className="divide-y rounded-xl border">
            {topUsers.map((u, i) => (
              <Link
                key={u.username}
                href={`/u/${u.username}`}
                className="flex items-center gap-3 p-3 hover:bg-accent/50"
              >
                <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm">
                  {u.name ?? u.username}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${tierClass(u.tier)}`}
                >
                  {u.tier}
                </span>
                <span className="text-xs text-muted-foreground">{u.points}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
