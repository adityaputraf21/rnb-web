"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Hash, User, Newspaper, Trophy, CalendarDays, Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QUICK = [
  { label: "Feed", href: "/feed", Icon: Newspaper },
  { label: "Forum", href: "/forum", Icon: Hash },
  { label: "Leaderboard", href: "/leaderboard", Icon: Trophy },
  { label: "Event", href: "/events", Icon: CalendarDays },
  { label: "Pengumuman", href: "/announcements", Icon: Megaphone },
];

type Result =
  | { type: "thread"; title: string; url: string; sub: string }
  | { type: "user"; title: string; url: string; sub: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const [s, u] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal }).then((r) => r.json()),
          fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal }).then((r) => r.json()),
        ]);
        setResults([
          ...(s.threads ?? []).slice(0, 5).map((t: { title: string; url: string; category: string }) => ({
            type: "thread" as const,
            title: t.title,
            url: t.url,
            sub: t.category,
          })),
          ...(Array.isArray(u) ? u : []).slice(0, 5).map((x: { username: string; name: string | null }) => ({
            type: "user" as const,
            title: x.name ?? x.username,
            url: `/u/${x.username}`,
            sub: `@${x.username}`,
          })),
        ]);
      } catch {
        /* aborted */
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  function go(url: string) {
    setOpen(false);
    setQ("");
    router.push(url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-24 translate-y-0 gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Cari & navigasi</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari thread, orang, atau halaman…"
            className="h-11 flex-1 bg-transparent text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim().length >= 2) {
                go(`/search?q=${encodeURIComponent(q.trim())}`);
              }
            }}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {q.trim().length < 2 && (
            <>
              <p className="px-2 py-1 text-xs text-muted-foreground">Buka cepat</p>
              {QUICK.map((item) => (
                <button
                  key={item.href}
                  onClick={() => go(item.href)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                >
                  <item.Icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </>
          )}
          {results.map((r) => (
            <button
              key={r.url}
              onClick={() => go(r.url)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
            >
              {r.type === "thread" ? (
                <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.sub}</span>
            </button>
          ))}
          {q.trim().length >= 2 && results.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              Tekan Enter untuk cari &quot;{q}&quot;
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
