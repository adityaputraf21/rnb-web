import Link from "next/link";
import { MessagesSquare, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSiteConfig } from "@/lib/site-config";
import { unreadDMCount } from "@/lib/dm";
import { unreadGroupCount } from "@/lib/group";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { NotificationsBell } from "@/components/notifications-bell";
import { SignInButton } from "@/components/sign-in-button";
import { SearchBox } from "@/components/search-box";
import { MobileNav } from "@/components/mobile-nav";

export async function SiteHeader() {
  const [user, cfg] = await Promise.all([getCurrentUser(), getSiteConfig()]);
  const dmUnread = user
    ? (
        await Promise.all([
          unreadDMCount(user.id).catch(() => 0),
          unreadGroupCount(user.id).catch(() => 0),
        ])
      ).reduce((a, b) => a + b, 0)
    : 0;

  const NAV = [
    { href: "/feed", label: "Feed" },
    { href: "/explore", label: "Jelajah" },
    { href: "/forum", label: "Forum" },
    ...(cfg.blogEnabled ? [{ href: "/blog", label: "Blog" }] : []),
    ...(cfg.questsEnabled && user ? [{ href: "/quests", label: "Quest" }] : []),
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/events", label: "Event" },
    { href: "/announcements", label: "Pengumuman" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center gap-2 sm:gap-4">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 font-bold">
          <MessagesSquare className="h-5 w-5 text-primary" />
          {cfg.siteName}
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => (
            <Button key={n.href} variant="ghost" size="sm" asChild>
              <Link href={n.href}>{n.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SearchBox />
          <ThemeToggle />
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Pesan"
                className="relative"
                asChild
              >
                <Link href="/messages">
                  <Mail />
                  {dmUnread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {dmUnread > 9 ? "9+" : dmUnread}
                    </span>
                  )}
                </Link>
              </Button>
              <NotificationsBell />
              <UserMenu user={user} />
            </>
          ) : (
            <SignInButton size="sm" />
          )}
        </div>
      </div>
    </header>
  );
}
