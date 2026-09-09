"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/forum", label: "Forum" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Event" },
  { href: "/announcements", label: "Pengumuman" },
  { href: "/search", label: "Cari" },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Menu"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute left-0 top-0 h-full w-64 space-y-1 border-r bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-2 pb-2 text-sm font-semibold text-muted-foreground">
              Menu
            </p>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
