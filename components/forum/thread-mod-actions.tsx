"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pin,
  PinOff,
  Lock,
  LockOpen,
  Trash2,
  Shield,
  FolderInput,
} from "lucide-react";
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
  currentCategoryId,
  categories,
  pinned,
  locked,
  canModerate,
  canDelete,
}: {
  threadId: string;
  categorySlug: string;
  currentCategoryId: string;
  categories: { id: string; name: string }[];
  pinned: boolean;
  locked: boolean;
  canModerate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [moving, setMoving] = React.useState(false);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error ?? "gagal");
      if (out.url) router.replace(out.url);
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
    <>
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
              <DropdownMenuItem onClick={() => setMoving(true)}>
                <FolderInput /> Pindah kategori
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

      {moving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xs rounded-lg border bg-background p-4">
            <h3 className="mb-2 font-semibold">Pindah ke kategori</h3>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {categories
                .filter((c) => c.id !== currentCategoryId)
                .map((c) => (
                  <button
                    key={c.id}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setMoving(false);
                      patch({ categoryId: c.id });
                    }}
                  >
                    {c.name}
                  </button>
                ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setMoving(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
