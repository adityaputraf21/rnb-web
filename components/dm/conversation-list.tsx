"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";

type Conv = {
  username: string;
  name: string | null;
  image: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
  mine: boolean;
};

export function ConversationList({
  initial,
  activeUsername,
}: {
  initial: Conv[];
  activeUsername?: string;
}) {
  const [convs, setConvs] = React.useState(initial);

  React.useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" });
        if (res.ok) setConvs(await res.json());
      } catch {
        /* ignore */
      }
    }, 10000);
    return () => clearInterval(t);
  }, []);

  if (convs.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Belum ada percakapan. Buka profil seseorang dan klik &quot;Pesan&quot;.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {convs.map((c) => (
        <Link
          key={c.username}
          href={`/messages/${c.username}`}
          className={cn(
            "flex items-center gap-3 p-3 hover:bg-accent/50",
            c.username === activeUsername && "bg-accent",
          )}
        >
          <Avatar>
            <AvatarImage src={c.image ?? undefined} />
            <AvatarFallback>{initials(c.name ?? c.username)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {c.name ?? c.username}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNowStrict(new Date(c.lastAt), {
                  locale: idLocale,
                })}
              </span>
            </div>
            <p
              className={cn(
                "truncate text-sm",
                c.unread > 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {c.mine && "Kamu: "}
              {c.lastMessage || "—"}
            </p>
          </div>
          {c.unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {c.unread}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
