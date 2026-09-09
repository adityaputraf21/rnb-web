"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Lock, LockOpen, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThreadModActions({
  threadId,
  categorySlug,
  pinned,
  locked,
  canModerate,
  canDelete,
}: {
  threadId: string;
  categorySlug: string;
  pinned: boolean;
  locked: boolean;
  canModerate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function patch(data: Record<string, boolean>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Hapus thread ini beserta semua balasannya?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      toast.success("Thread dihapus");
      router.push(`/forum/${categorySlug}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  if (!canModerate && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy}>
          <Shield /> Kelola
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canModerate && (
          <>
            <DropdownMenuLabel>Moderasi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => patch({ pinned: !pinned })}>
              {pinned ? <PinOff /> : <Pin />}
              {pinned ? "Lepas pin" : "Pin thread"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => patch({ locked: !locked })}>
              {locked ? <LockOpen /> : <Lock />}
              {locked ? "Buka kunci" : "Kunci thread"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {canDelete && (
          <DropdownMenuItem
            onClick={remove}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 /> Hapus thread
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
