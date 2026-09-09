import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSiteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { NotificationsBell } from "@/components/notifications-bell";
import { SignInButton } from "@/components/sign-in-button";
import { SearchBox } from "@/components/search-box";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/forum", label: "Forum" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Event" },
  { href: "/announcements", label: "Pengumuman" },
];

export async function SiteHeader() {
  const [user, cfg] = await Promise.all([getCurrentUser(), getSiteConfig()]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center gap-4">
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
