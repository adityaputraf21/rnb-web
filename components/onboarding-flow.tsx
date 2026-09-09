"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials, cn } from "@/lib/utils";

type U = {
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
};

export function OnboardingFlow({ suggestions }: { suggestions: U[] }) {
  const router = useRouter();
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  function toggle(u: string) {
    setPicked((p) => {
      const n = new Set(p);
      n.has(u) ? n.delete(u) : n.add(u);
      return n;
    });
  }

  async function finish() {
    setBusy(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ follow: [...picked] }),
    });
    router.replace("/feed");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-5 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Selamat datang! 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ikuti beberapa akun biar feed-mu langsung ramai.
        </p>
      </div>

      <div className="space-y-2">
        {suggestions.map((u) => {
          const on = picked.has(u.username);
          return (
            <button
              key={u.username}
              onClick={() => toggle(u.username)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                on ? "border-primary bg-primary/5" : "hover:bg-accent/50",
              )}
            >
              <Avatar>
                <AvatarImage src={u.image ?? undefined} />
                <AvatarFallback>{initials(u.name ?? u.username)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.name ?? u.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{u.username}
                  {u.bio ? ` · ${u.bio.replace(/[#*`>_[\]!]/g, "").slice(0, 40)}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border",
                  on && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {on && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={finish} disabled={busy}>
          {picked.size > 0 ? `Ikuti ${picked.size} & lanjut` : "Lanjut"}
        </Button>
      </div>
    </div>
  );
}
