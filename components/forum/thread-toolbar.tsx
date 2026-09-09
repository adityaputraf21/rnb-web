"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, Bell, BellOff, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReportButton } from "@/components/forum/report-button";

export function ThreadToolbar({
  threadId,
  initialBookmarked,
  initialSubscribed,
  loggedIn,
}: {
  threadId: string;
  initialBookmarked: boolean;
  initialSubscribed: boolean;
  loggedIn: boolean;
}) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [subscribed, setSubscribed] = React.useState(initialSubscribed);
  const [busy, setBusy] = React.useState(false);

  async function toggleBookmark() {
    if (!loggedIn) return toast.error("Masuk dulu");
    setBusy(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? "Disimpan ke bookmark" : "Dihapus dari bookmark");
    } catch {
      toast.error("Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSub() {
    if (!loggedIn) return toast.error("Masuk dulu");
    setBusy(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/subscribe`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setSubscribed(data.subscribed);
      toast.success(data.subscribed ? "Kamu akan dinotifikasi" : "Notifikasi dimatikan");
    } catch {
      toast.error("Gagal");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link disalin");
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button variant="ghost" size="sm" onClick={toggleBookmark} disabled={busy}>
        {bookmarked ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
        {bookmarked ? "Tersimpan" : "Bookmark"}
      </Button>
      <Button variant="ghost" size="sm" onClick={toggleSub} disabled={busy}>
        {subscribed ? <BellOff /> : <Bell />}
        {subscribed ? "Berhenti ikuti" : "Ikuti"}
      </Button>
      <Button variant="ghost" size="sm" onClick={copyLink}>
        <Link2 /> Salin link
      </Button>
      {loggedIn && <ReportButton targetType="thread" targetId={threadId} />}
    </div>
  );
}
