"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, CheckCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MyListingActions({
  id,
  slug,
  status,
}: {
  id: string;
  slug: string;
  status: string;
}) {
  const router = useRouter();

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return toast.error("Gagal");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Hapus iklan ini?")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal");
    toast.success("Dihapus");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/market/${slug}/edit`}>
            <Pencil /> Sunting
          </Link>
        </DropdownMenuItem>
        {status !== "sold" ? (
          <DropdownMenuItem onClick={() => patch({ status: "sold" })}>
            <CheckCircle /> Tandai terjual
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => patch({ status: "active" })}>
            <RotateCcw /> Aktifkan lagi
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={remove}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 /> Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
