"use client";

import * as React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { CallWindow } from "@/components/calls/call-window";

type Peer = { username: string; name: string | null; image: string | null };
type ActiveCall = {
  id: string;
  kind: string;
  iAmCaller: boolean;
  peer: Peer;
};

export function CallProvider() {
  const [incoming, setIncoming] = React.useState<ActiveCall | null>(null);
  const [active, setActive] = React.useState<ActiveCall | null>(null);
  const activeIdRef = React.useRef<string | null>(null);
  activeIdRef.current = active?.id ?? null;

  // Poll panggilan masuk / aktif.
  React.useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/calls", { cache: "no-store" });
        if (!res.ok) return;
        const { call } = await res.json();
        if (!call) {
          setIncoming(null);
          return;
        }
        if (call.id === activeIdRef.current) return;
        if (call.status === "ringing" && !call.iAmCaller) {
          setIncoming(call);
        } else if (call.status === "active" && !activeIdRef.current) {
          // panggilan yang sudah terlanjur aktif (mis. reload)
          setActive(call);
          setIncoming(null);
        }
      } catch {
        /* ignore */
      }
    };
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, []);

  // Mulai panggilan lewat event global (dari tombol di chat).
  React.useEffect(() => {
    async function onStart(e: Event) {
      const { username, kind } = (e as CustomEvent).detail as {
        username: string;
        kind: string;
      };
      if (active || incoming) return toast.error("Masih ada panggilan aktif");
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, kind }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "gagal");
        setActive({
          id: d.id,
          kind: d.kind,
          iAmCaller: true,
          peer: { username, name: null, image: null },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memanggil");
      }
    }
    window.addEventListener("rnb:call", onStart);
    return () => window.removeEventListener("rnb:call", onStart);
  }, [active, incoming]);

  async function accept() {
    if (!incoming) return;
    setActive(incoming);
    setIncoming(null);
  }

  async function decline() {
    if (!incoming) return;
    await fetch(`/api/calls/${incoming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }).catch(() => {});
    setIncoming(null);
  }

  return (
    <>
      {incoming && !active && (
        <div className="fixed inset-x-0 top-4 z-[125] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border bg-background p-3 shadow-xl">
          <Avatar>
            <AvatarImage src={incoming.peer.image ?? undefined} />
            <AvatarFallback>
              {initials(incoming.peer.name ?? incoming.peer.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">
              {incoming.peer.name ?? incoming.peer.username}
            </p>
            <p className="text-xs text-muted-foreground">
              Panggilan {incoming.kind === "audio" ? "suara" : "video"} masuk…
            </p>
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="rounded-full"
            onClick={decline}
          >
            <PhoneOff />
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-green-600 hover:bg-green-700"
            onClick={accept}
          >
            <Phone />
          </Button>
        </div>
      )}

      {active && (
        <CallWindow
          callId={active.id}
          iAmCaller={active.iAmCaller}
          kind={active.kind}
          peer={active.peer}
          onEnd={() => setActive(null)}
        />
      )}
    </>
  );
}
