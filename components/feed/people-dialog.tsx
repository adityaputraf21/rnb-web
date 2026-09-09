"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials } from "@/lib/utils";

type Person = {
  username: string;
  name: string | null;
  image: string | null;
  quote?: string | null;
  statusId?: string;
};

export function PeopleDialog({
  open,
  onOpenChange,
  title,
  fetchUrl,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  fetchUrl: string;
}) {
  const [people, setPeople] = React.useState<Person[] | null>(null);

  React.useEffect(() => {
    if (open && people == null) {
      fetch(fetchUrl)
        .then((r) => (r.ok ? r.json() : []))
        .then(setPeople)
        .catch(() => setPeople([]));
    }
  }, [open, fetchUrl, people]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {people == null && (
          <p className="py-4 text-center text-sm text-muted-foreground">Memuat…</p>
        )}
        {people?.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Belum ada.
          </p>
        )}
        <div className="space-y-1">
          {people?.map((p, i) => (
            <Link
              key={p.statusId ?? p.username ?? i}
              href={p.statusId ? `/feed/${p.statusId}` : `/u/${p.username}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={p.image ?? undefined} />
                <AvatarFallback>{initials(p.name ?? p.username)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.name ?? p.username}{" "}
                  <span className="text-muted-foreground">@{p.username}</span>
                </p>
                {p.quote && (
                  <p className="truncate text-xs text-muted-foreground">
                    &ldquo;{p.quote}&rdquo;
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
