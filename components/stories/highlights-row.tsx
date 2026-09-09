"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryGroup } from "@/components/stories/types";

export type HL = {
  id: string;
  mediaUrl: string;
  mediaType: string;
  bgColor: string | null;
  caption: string | null;
};

export function HighlightsRow({
  highlights,
  owner,
  isMe,
}: {
  highlights: HL[];
  owner: { username: string; name: string | null; image: string | null };
  isMe: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(highlights);

  if (items.length === 0) return null;

  const group: StoryGroup = {
    username: owner.username,
    name: owner.name,
    image: owner.image,
    allViewed: true,
    items: items.map((h) => ({
      id: h.id,
      mediaUrl: h.mediaUrl,
      mediaType: h.mediaType,
      bgColor: h.bgColor,
      caption: h.caption,
      createdAt: new Date().toISOString(),
      viewed: true,
      views: 0,
      mine: isMe,
    })),
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-16 shrink-0 flex-col items-center gap-1"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/40 text-lg">
          ⭐
        </div>
        <span className="text-xs">Highlight ({items.length})</span>
      </button>

      {open && (
        <StoryViewer
          groups={[group]}
          startGroup={0}
          track={false}
          onClose={() => setOpen(false)}
          onViewed={() => {}}
          onDelete={
            isMe
              ? async (id) => {
                  const res = await fetch(`/api/highlights/${id}`, {
                    method: "DELETE",
                  });
                  if (res.ok) {
                    toast.success("Highlight dihapus");
                    setItems((p) => p.filter((x) => x.id !== id));
                    router.refresh();
                  }
                }
              : undefined
          }
        />
      )}
    </>
  );
}
