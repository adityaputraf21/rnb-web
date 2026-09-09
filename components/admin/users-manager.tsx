"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { ROLE_LABEL, ROLE_BADGE } from "@/lib/tier-style";
import { ModNotesDialog } from "@/components/admin/mod-notes-dialog";

type Row = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  role: "USER" | "MODERATOR" | "ADMIN" | "OWNER";
  points: number;
  tier: string;
  bannedAt: string | null;
  mutedUntil: string | null;
};

const RANK = { USER: 0, MODERATOR: 1, ADMIN: 2, OWNER: 3 };

export function UsersManager({
  initial,
  myRole,
  meId,
}: {
  initial: Row[];
  myRole: Row["role"];
  meId: string;
}) {
  const [rows, setRows] = React.useState<Row[]>(initial);
  const [q, setQ] = React.useState("");

  async function search(term: string) {
    setQ(term);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(term)}`);
    if (res.ok) setRows(await res.json());
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "gagal");
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              role: data.role ?? r.role,
              bannedAt: data.bannedAt ?? null,
              mutedUntil: data.mutedUntil ?? null,
              points: data.points ?? r.points,
              tier: data.tier ?? r.tier,
            }
          : r,
      ),
    );
    toast.success("Tersimpan");
  }

  const canActOn = (r: Row) =>
    r.id === meId || RANK[myRole] > RANK[r.role];
  const canSetRole = myRole === "OWNER" || myRole === "ADMIN";

  return (
    <div className="space-y-3">
      <Input
        placeholder="Cari username / nama…"
        value={q}
        onChange={(e) => search(e.target.value)}
      />
      <Card className="divide-y">
        {rows.map((r) => {
          const muted = r.mutedUntil && new Date(r.mutedUntil) > new Date();
          return (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={r.image ?? undefined} />
                <AvatarFallback>{initials(r.name ?? r.username)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <Link href={`/u/${r.username}`} className="hover:underline">
                    {r.name ?? r.username}
                  </Link>{" "}
                  <span className="text-muted-foreground">@{r.username}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.tier} · {r.points} poin
                </p>
              </div>
              {r.role !== "USER" && (
                <Badge className={ROLE_BADGE[r.role]}>{ROLE_LABEL[r.role]}</Badge>
              )}
              {r.bannedAt && <Badge variant="destructive">Blokir</Badge>}
              {muted && <Badge variant="secondary">Timeout</Badge>}

              <ModNotesDialog userId={r.id} username={r.username} />

              {canActOn(r) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Aksi
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {canSetRole && r.id !== meId && (
                      <>
                        <DropdownMenuLabel>Role</DropdownMenuLabel>
                        {(["USER", "MODERATOR", "ADMIN", "OWNER"] as const)
                          .filter(
                            (role) =>
                              role !== "OWNER" ||
                              myRole === "OWNER",
                          )
                          .map((role) => (
                            <DropdownMenuItem
                              key={role}
                              disabled={r.role === role}
                              onClick={() => patch(r.id, { role })}
                            >
                              {ROLE_LABEL[role]}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={async () => {
                        const reason = prompt("Alasan peringatan:");
                        if (!reason || reason.trim().length < 3) return;
                        const res = await fetch("/api/admin/warnings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: r.id, reason }),
                        });
                        const d = await res.json();
                        if (!res.ok) return toast.error(d.error ?? "gagal");
                        toast.success(
                          `Peringatan terkirim (${d.active} aktif)${d.escalation ?? ""}`,
                        );
                      }}
                    >
                      Beri peringatan…
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Timeout</DropdownMenuLabel>
                    {[10, 60, 1440].map((m) => (
                      <DropdownMenuItem
                        key={m}
                        onClick={() => patch(r.id, { muteMinutes: m })}
                      >
                        Mute {m < 60 ? `${m} menit` : m < 1440 ? `${m / 60} jam` : "1 hari"}
                      </DropdownMenuItem>
                    ))}
                    {muted && (
                      <DropdownMenuItem onClick={() => patch(r.id, { muteMinutes: 0 })}>
                        Cabut timeout
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canSetRole && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            const n = Number(prompt("Tambah/kurangi poin (mis. 50 atau -20):"));
                            if (Number.isInteger(n) && n !== 0)
                              patch(r.id, { pointsDelta: n });
                          }}
                        >
                          Atur poin…
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {r.id !== meId && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (r.bannedAt) return patch(r.id, { banned: false });
                          const reason = prompt("Alasan blokir (opsional):") ?? "";
                          patch(r.id, { banned: true, banReason: reason });
                        }}
                      >
                        {r.bannedAt ? "Cabut blokir" : "Blokir permanen"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
