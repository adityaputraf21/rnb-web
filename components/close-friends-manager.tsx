"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, X, Search } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/utils";

type U = { username: string; name: string | null; image: string | null };

export function CloseFriendsManager({ initial }: { initial: U[] }) {
  const router = useRouter();
  const [friends, setFriends] = React.useState<U[]>(initial);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<U[]>([]);

  React.useEffect(() => {
    if (q.trim().length < 1) return setResults([]);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function toggle(u: U, add: boolean) {
    const res = await fetch(`/api/close-friends/${u.username}`, {
      method: "POST",
    });
    if (!res.ok) return toast.error("Gagal");
    setFriends((p) =>
      add ? [...p, u] : p.filter((x) => x.username !== u.username),
    );
    setQ("");
    setResults([]);
    router.refresh();
  }

  const friendSet = new Set(friends.map((f) => f.username));

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">
          Close friends ({friends.length})
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Story dengan audiens &quot;Close friends&quot; cuma terlihat oleh daftar
        ini.
      </p>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari untuk menambah…"
          className="pl-8"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-md">
            {results
              .filter((r) => !friendSet.has(r.username))
              .map((r) => (
                <button
                  key={r.username}
                  onClick={() => toggle(r, true)}
                  className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-accent"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={r.image ?? undefined} />
                    <AvatarFallback>
                      {initials(r.name ?? r.username)}
                    </AvatarFallback>
                  </Avatar>
                  {r.name ?? r.username}
                  <span className="text-muted-foreground">@{r.username}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        {friends.map((f) => (
          <div
            key={f.username}
            className="flex items-center gap-2 rounded-lg p-1.5"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={f.image ?? undefined} />
              <AvatarFallback>{initials(f.name ?? f.username)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm">
              {f.name ?? f.username}{" "}
              <span className="text-muted-foreground">@{f.username}</span>
            </span>
            <button
              onClick={() => toggle(f, false)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
