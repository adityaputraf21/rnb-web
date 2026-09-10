"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWA() {
  const [deferred, setDeferred] = React.useState<BIPEvent | null>(null);
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    // Daftarkan service worker (offline + push).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    try {
      if (localStorage.getItem("rnb-install-dismissed")) return;
    } catch {
      /* ignore */
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setHidden(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || !deferred) return null;

  async function install() {
    await deferred!.prompt();
    await deferred!.userChoice;
    setHidden(true);
    setDeferred(null);
  }

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem("rnb-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border bg-background p-3 shadow-xl sm:left-auto sm:right-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Download className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-medium">Pasang aplikasi RnB</p>
        <p className="text-xs text-muted-foreground">
          Akses cepat dari layar utama, plus notifikasi.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        Pasang
      </Button>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
