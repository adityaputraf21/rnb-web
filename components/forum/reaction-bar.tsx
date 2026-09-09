"use client";

import { ReactionBar as GenericReactionBar } from "@/components/reaction-bar";

type Count = { emoji: string; count: number };

export function ReactionBar({
  postId,
  initialCounts,
  initialMine,
  canReact,
}: {
  postId: string;
  initialCounts: Count[];
  initialMine: string[];
  canReact: boolean;
}) {
  return (
    <GenericReactionBar
      endpoint={`/api/posts/${postId}/reactions`}
      initialCounts={initialCounts}
      initialMine={initialMine}
      canReact={canReact}
    />
  );
}
