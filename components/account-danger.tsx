"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function AccountDanger({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function del() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success("Akun dihapus. Sampai jumpa.");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-destructive/40 p-4">
      <h2 className="text-sm font-semibold text-destructive">Zona berbahaya</h2>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/api/account/export">
            <Download className="h-4 w-4" /> Ekspor data saya
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" /> Hapus akun
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus akun permanen</DialogTitle>
            <DialogDescription>
              Akun, pesan pribadi, story, dan iklan Pasar-mu akan dihapus. Thread,
              balasan, dan status akan dianonimkan. Tindakan ini tidak bisa
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm">
              Ketik <span className="font-mono font-semibold">{username}</span>{" "}
              untuk konfirmasi:
            </label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={busy || confirm.toLowerCase() !== username}
              onClick={del}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Hapus selamanya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
