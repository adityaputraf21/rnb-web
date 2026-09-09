"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/forum", label: "Forum" },
  { href: "/messages", label: "Pesan" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Event" },
  { href: "/announcements", label: "Pengumuman" },
  { href: "/search", label: "Cari" },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Menu"
        className="sm:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[100] sm:hidden">
            <button
              aria-label="Tutup menu"
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <nav className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col gap-1 border-r bg-background p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X />
                </Button>
              </div>
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
