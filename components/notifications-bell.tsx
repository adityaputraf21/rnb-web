"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && unread > 0) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2 text-sm font-semibold">Notifikasi</div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Belum ada notifikasi.
            </p>
          )}
          {items.map((n) => {
            const inner = (
              <div
                className={cn(
                  "px-3 py-2.5 text-sm hover:bg-accent",
                  !n.read && "bg-primary/5",
                )}
              >
                <p className="font-medium">{n.title}</p>
                {n.body && (
                  <p className="line-clamp-2 text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </p>
              </div>
            );
            return n.url ? (
              <Link key={n.id} href={n.url} onClick={() => setOpen(false)}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
