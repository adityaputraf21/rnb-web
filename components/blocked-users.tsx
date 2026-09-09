"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BlockedUsers({
  initial,
}: {
  initial: { username: string; name: string | null }[];
}) {
  const [list, setList] = React.useState(initial);

  async function unblock(username: string) {
    const res = await fetch(`/api/block/${username}`, { method: "POST" });
    if (res.ok) {
      setList((l) => l.filter((u) => u.username !== username));
      toast.success("Blokir dicabut");
    }
  }

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Pengguna diblokir</h2>
      {list.length === 0 && (
        <p className="text-xs text-muted-foreground">Tidak ada.</p>
      )}
      {list.map((u) => (
        <div key={u.username} className="flex items-center justify-between text-sm">
          <span>
            {u.name ?? u.username}{" "}
            <span className="text-muted-foreground">@{u.username}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => unblock(u.username)}>
            Cabut
          </Button>
        </div>
      ))}
    </div>
  );
}
