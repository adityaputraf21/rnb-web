"use client";

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";

export type GroupRow = {
  id: string;
  name: string;
  image: string | null;
  memberCount: number;
  lastMessage: string;
  lastSender: string | null;
  lastAt: string;
  unread: number;
};

export function GroupList({ initial }: { initial: GroupRow[] }) {
  const [groups, setGroups] = React.useState(initial);

  React.useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/groups", { cache: "no-store" });
        if (res.ok) setGroups(await res.json());
      } catch {
        /* ignore */
      }
    }, 10000);
    return () => clearInterval(t);
  }, []);

  if (groups.length === 0) return null;

  return (
    <div className="divide-y">
      {groups.map((g) => (
        <Link
          key={g.id}
          href={`/groups/${g.id}`}
          className="flex items-center gap-3 p-3 hover:bg-accent/50"
        >
          <Avatar>
            <AvatarImage src={g.image ?? undefined} />
            <AvatarFallback>
              {g.image ? initials(g.name) : <Users className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{g.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNowStrict(new Date(g.lastAt), {
                  locale: idLocale,
                })}
              </span>
            </div>
            <p
              className={cn(
                "truncate text-sm",
                g.unread > 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {g.lastSender ? `${g.lastSender}: ` : ""}
              {g.lastMessage || `${g.memberCount} anggota`}
            </p>
          </div>
          {g.unread > 0 && (
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </Link>
      ))}
    </div>
  );
}
