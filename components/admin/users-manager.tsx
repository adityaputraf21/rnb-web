"use client";

import * as React from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/tier-style";

type Row = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  points: number;
  tier: string;
  bannedAt: string | null;
  banReason: string | null;
};

export function UsersManager({
  initial,
  isAdmin,
  meId,
}: {
  initial: Row[];
  isAdmin: boolean;
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
          ? { ...r, role: data.role ?? r.role, bannedAt: data.bannedAt ?? null }
          : r,
      ),
    );
    toast.success("Tersimpan");
  }

  function toggleBan(r: Row) {
    if (r.bannedAt) return patch(r.id, { banned: false });
    const reason = prompt("Alasan blokir (opsional):") ?? "";
    return patch(r.id, { banned: true, banReason: reason });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Cari username / nama…"
        value={q}
        onChange={(e) => search(e.target.value)}
      />
      <Card className="divide-y">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={r.image ?? undefined} />
              <AvatarFallback>{initials(r.name ?? r.username)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {r.name ?? r.username}{" "}
                <span className="text-muted-foreground">@{r.username}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {r.tier} · {r.points} poin
              </p>
            </div>
            {r.role !== "USER" && <Badge>{ROLE_LABEL[r.role]}</Badge>}
            {r.bannedAt && <Badge variant="destructive">Blokir</Badge>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Aksi
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin &&
                  r.role !== "ADMIN" &&
                  (["USER", "MODERATOR", "ADMIN"] as const).map((role) => (
                    <DropdownMenuItem
                      key={role}
                      disabled={r.role === role}
                      onClick={() => patch(r.id, { role })}
                    >
                      Jadikan {ROLE_LABEL[role]}
                    </DropdownMenuItem>
                  ))}
                {r.role !== "ADMIN" && r.id !== meId && (
                  <DropdownMenuItem
                    onClick={() => toggleBan(r)}
                    className="text-destructive focus:text-destructive"
                  >
                    {r.bannedAt ? "Cabut blokir" : "Blokir"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </Card>
    </div>
  );
}
