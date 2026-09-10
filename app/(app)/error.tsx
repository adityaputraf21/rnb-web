"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-semibold">Ada yang tidak beres</h1>
      <p className="text-sm text-muted-foreground">
        Coba muat ulang halaman. Kalau terus terjadi, laporkan ke admin.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          kode: {error.digest}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset}>Coba lagi</Button>
        <Button variant="outline" asChild>
          <Link href="/feed">Ke Feed</Link>
        </Button>
      </div>
    </div>
  );
}
