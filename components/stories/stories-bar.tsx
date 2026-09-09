"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { StoryComposer } from "@/components/stories/story-composer";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryGroup } from "@/components/stories/types";

export type { StoryGroup, StoryItem } from "@/components/stories/types";

export function StoriesBar({
  loggedIn,
  myAvatar,
  myUsername,
  myName,
}: {
  loggedIn: boolean;
  myAvatar?: string | null;
  myUsername?: string;
  myName?: string | null;
}) {
  const [groups, setGroups] = React.useState<StoryGroup[]>([]);
  const [composing, setComposing] = React.useState(false);
  const [viewer, setViewer] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/stories", { cache: "no-store" });
      if (res.ok) setGroups(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const mineGroupIdx = groups.findIndex((g) => g.username === myUsername);
  const hasMine = mineGroupIdx >= 0;

  if (!loggedIn && groups.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {loggedIn && (
          <button
            onClick={() =>
              hasMine ? setViewer(mineGroupIdx) : setComposing(true)
            }
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <div className="relative">
              <Avatar
                className={cn(
                  "h-16 w-16",
                  hasMine && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <AvatarImage src={myAvatar ?? undefined} />
                <AvatarFallback>{initials(myName ?? myUsername)}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                <Plus className="h-3 w-3" />
              </span>
            </div>
            <span className="w-full truncate text-center text-xs">Story kamu</span>
          </button>
        )}

        {groups
          .filter((g) => g.username !== myUsername)
          .map((g) => {
            const realIdx = groups.indexOf(g);
            return (
              <button
                key={g.username}
                onClick={() => setViewer(realIdx)}
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                <Avatar
                  className={cn(
                    "h-16 w-16 ring-2 ring-offset-2 ring-offset-background",
                    g.allViewed ? "ring-muted" : "ring-primary",
                  )}
                >
                  <AvatarImage src={g.image ?? undefined} />
                  <AvatarFallback>{initials(g.name ?? g.username)}</AvatarFallback>
                </Avatar>
                <span className="w-full truncate text-center text-xs">
                  {g.name ?? g.username}
                </span>
              </button>
            );
          })}
      </div>

      {composing && (
        <StoryComposer
          onClose={() => setComposing(false)}
          onCreated={load}
        />
      )}
      {viewer !== null && groups[viewer] && (
        <StoryViewer
          groups={groups}
          startGroup={viewer}
          onClose={() => {
            setViewer(null);
            load();
          }}
          onViewed={(id) =>
            setGroups((gs) =>
              gs.map((g) => ({
                ...g,
                items: g.items.map((it) =>
                  it.id === id ? { ...it, viewed: true } : it,
                ),
              })),
            )
          }
        />
      )}
    </>
  );
}
