"use client";

import * as React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials, cn } from "@/lib/utils";

const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

type Peer = { username: string; name: string | null; image: string | null };

export function CallWindow({
  callId,
  iAmCaller,
  kind,
  peer,
  onEnd,
}: {
  callId: string;
  iAmCaller: boolean;
  kind: string;
  peer: Peer;
  onEnd: () => void;
}) {
  const localRef = React.useRef<HTMLVideoElement>(null);
  const remoteRef = React.useRef<HTMLVideoElement>(null);
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const answeredRef = React.useRef(false);
  const [state, setState] = React.useState<"connecting" | "ringing" | "live">(
    iAmCaller ? "ringing" : "connecting",
  );
  const [micOn, setMicOn] = React.useState(true);
  const [camOn, setCamOn] = React.useState(kind === "video");
  const [secs, setSecs] = React.useState(0);

  const cleanup = React.useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const hangup = React.useCallback(async () => {
    cleanup();
    await fetch(`/api/calls/${callId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" }),
    }).catch(() => {});
    onEnd();
  }, [callId, cleanup, onEnd]);

  React.useEffect(() => {
    let cancelled = false;
    let since: string | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;

    async function init() {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: kind === "video",
        });
      } catch {
        toast.error("Tidak bisa akses kamera/mikrofon");
        hangup();
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
        setState("live");
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          fetch(`/api/calls/${callId}/candidates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: e.candidate.toJSON() }),
          }).catch(() => {});
        }
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          if (pc.connectionState === "failed") toast.error("Koneksi gagal");
        }
      };

      if (iAmCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await fetch(`/api/calls/${callId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offer }),
        });
      }

      poll = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/calls/${callId}${since ? `?since=${encodeURIComponent(since)}` : ""}`,
            { cache: "no-store" },
          );
          if (!res.ok) return;
          const d = await res.json();
          since = d.serverNow;

          if (["ended", "declined", "missed"].includes(d.status)) {
            toast(d.status === "declined" ? "Panggilan ditolak" : "Panggilan berakhir");
            cleanup();
            onEnd();
            return;
          }

          // Callee: terima offer -> buat answer.
          if (!iAmCaller && d.offer && !answeredRef.current) {
            answeredRef.current = true;
            await pc.setRemoteDescription(d.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await fetch(`/api/calls/${callId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer, status: "active" }),
            });
            setState("connecting");
          }

          // Caller: terima answer.
          if (iAmCaller && d.answer && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(d.answer);
          }

          for (const c of d.candidates ?? []) {
            try {
              await pc.addIceCandidate(c.data);
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      }, 1500);
    }

    init();
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, iAmCaller, kind]);

  React.useEffect(() => {
    if (state !== "live") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }
  function toggleCam() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-black">
      <div className="relative flex-1">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={cn(
            "h-full w-full object-cover",
            state !== "live" && "opacity-0",
          )}
        />
        {state !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <Avatar className="h-24 w-24">
              <AvatarImage src={peer.image ?? undefined} />
              <AvatarFallback className="text-2xl">
                {initials(peer.name ?? peer.username)}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-medium">{peer.name ?? peer.username}</p>
            <p className="text-sm text-white/70">
              {state === "ringing" ? "Memanggil…" : "Menghubungkan…"}
            </p>
          </div>
        )}
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 h-40 w-28 rounded-lg border border-white/20 object-cover"
        />
        {state === "live" && (
          <p className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-6">
        <Button
          onClick={toggleMic}
          size="icon"
          variant={micOn ? "secondary" : "destructive"}
          className="h-12 w-12 rounded-full"
        >
          {micOn ? <Mic /> : <MicOff />}
        </Button>
        {kind === "video" && (
          <Button
            onClick={toggleCam}
            size="icon"
            variant={camOn ? "secondary" : "destructive"}
            className="h-12 w-12 rounded-full"
          >
            {camOn ? <Video /> : <VideoOff />}
          </Button>
        )}
        <Button
          onClick={hangup}
          size="icon"
          variant="destructive"
          className="h-14 w-14 rounded-full"
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
