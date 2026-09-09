"use client";

import * as React from "react";
import { toast } from "sonner";

const ITEMS: { key: string; label: string }[] = [
  { key: "notifyMention", label: "Saat disebut (@mention)" },
  { key: "notifyReply", label: "Balasan di thread/status kamu" },
  { key: "notifyReaction", label: "Reaksi & like" },
  { key: "notifyFollow", label: "Pengikut baru" },
  { key: "notifyEmailDigest", label: "Email rekap mingguan" },
];

export function NotificationPrefs({
  initial,
}: {
  initial: Record<string, boolean>;
}) {
  const [prefs, setPrefs] = React.useState(initial);

  async function toggle(key: string) {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    const res = await fetch("/api/notification-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next }),
    });
    if (!res.ok) {
      setPrefs((p) => ({ ...p, [key]: !next }));
      toast.error("Gagal menyimpan");
    }
  }

  return (
    <div className="space-y-2 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Notifikasi</h2>
      {ITEMS.map((it) => (
        <label key={it.key} className="flex items-center justify-between text-sm">
          {it.label}
          <input
            type="checkbox"
            checked={prefs[it.key] ?? true}
            onChange={() => toggle(it.key)}
          />
        </label>
      ))}
    </div>
  );
}
