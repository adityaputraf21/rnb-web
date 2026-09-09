"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderInput, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Folder } from "@/components/bookmarks/folder-bar";

export function MoveMenu({
  folders,
  currentFolderId,
  target,
}: {
  folders: Folder[];
  currentFolderId: string | null;
  target: { threadId?: string; statusId?: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function move(folderId: string | null) {
    setBusy(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, folderId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "gagal");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={busy}>
          <FolderInput className="h-3.5 w-3.5" /> Folder
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => move(null)}>
          {currentFolderId === null && <Check className="h-3.5 w-3.5" />}
          Tanpa folder
        </DropdownMenuItem>
        {folders.map((f) => (
          <DropdownMenuItem key={f.id} onClick={() => move(f.id)}>
            {currentFolderId === f.id && <Check className="h-3.5 w-3.5" />}
            {f.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
