"use client";

import * as React from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function FollowButton({
  username,
  initialFollowing,
  loggedIn,
  size = "sm",
}: {
  username: string;
  initialFollowing: boolean;
  loggedIn: boolean;
  size?: ButtonProps["size"];
}) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    if (!loggedIn) {
      toast.error("Masuk dulu");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/follow/${username}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setFollowing(data.following);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant={following ? "outline" : "default"}
      onClick={toggle}
      disabled={busy}
    >
      {following ? <UserCheck /> : <UserPlus />}
      {following ? "Mengikuti" : "Ikuti"}
    </Button>
  );
}
