"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function WikiLockToggle({
  slug,
  locked,
}: {
  slug: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/wiki/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !locked }),
      });
      if (!res.ok) throw new Error();
      toast.success(!locked ? "Halaman dikunci" : "Halaman dibuka");
      router.refresh();
    } catch {
      toast.error("Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" disabled={busy} onClick={toggle}>
      {locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
    </Button>
  );
}
