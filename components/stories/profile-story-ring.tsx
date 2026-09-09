"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryGroup } from "@/components/stories/types";

/** Avatar profil + ring story kalau user punya story aktif. */
export function ProfileStoryRing({
  username,
  name,
  image,
}: {
  username: string;
  name: string | null;
  image: string | null;
}) {
  const [group, setGroup] = React.useState<StoryGroup | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/stories/user/${username}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => setGroup(g))
      .catch(() => {});
  }, [username]);

  const avatar = (
    <Avatar
      className={cn(
        "h-24 w-24 border-4 border-background shadow-lg sm:h-28 sm:w-28",
        group &&
          (group.allViewed
            ? "ring-2 ring-muted ring-offset-2 ring-offset-background"
            : "ring-2 ring-primary ring-offset-2 ring-offset-background"),
      )}
    >
      <AvatarImage src={image ?? undefined} />
      <AvatarFallback className="text-2xl">
        {initials(name ?? username)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      {group ? (
        <button onClick={() => setOpen(true)} aria-label="Lihat story">
          {avatar}
        </button>
      ) : (
        avatar
      )}
      {open && group && (
        <StoryViewer
          groups={[group]}
          startGroup={0}
          onClose={() => setOpen(false)}
          onViewed={(id) =>
            setGroup((g) =>
              g
                ? {
                    ...g,
                    items: g.items.map((it) =>
                      it.id === id ? { ...it, viewed: true } : it,
                    ),
                  }
                : g,
            )
          }
        />
      )}
    </>
  );
}
