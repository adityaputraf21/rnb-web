"use client";

import * as React from "react";
import { Calendar, Clock, Bell, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ThreadReminderProps {
  threadId: string;
  reminder?: { scheduledFor: Date } | null;
}

export function ThreadReminder({ threadId, reminder }: ThreadReminderProps) {
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(!reminder);
  const [date, setDate] = React.useState<string>(
    reminder
      ? reminder.scheduledFor.toISOString().split("T")[0]
      : "",
  );
  const [time, setTime] = React.useState<string>(
    reminder
      ? reminder.scheduledFor.toISOString().split("T")[1].substring(0, 5)
      : "10:00",
  );

  async function handleSetReminder() {
    if (!date || !time) {
      toast.error("Pilih tanggal dan jam");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/reminder`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scheduledFor: new Date(`${date}T${time}:00Z`),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Gagal set reminder");
        return;
      }

      setShowForm(false);
      toast.success("Reminder dijadwalkan!");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteReminder() {
    if (!confirm("Hapus reminder ini?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/reminder`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal hapus reminder");

      setShowForm(true);
      toast.success("Reminder dihapus");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Pengingat Thread</h3>
      </div>

      {reminder && !showForm && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700">
              Reminder dijadwalkan untuk{" "}
              <strong>
                {formatDate(reminder.scheduledFor, "dd MMM yyyy HH:mm", {
                  locale: idLocale,
                })}
              </strong>
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowForm(true)}
            className="h-6"
          >
            Ubah
          </Button>
        </div>
      )}

      {showForm && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tanggal</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Jam</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSetReminder}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "..." : "Set Reminder"}
            </Button>
            {reminder && (
              <Button
                onClick={handleDeleteReminder}
                disabled={loading}
                variant="destructive"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Kamu akan dapat notifikasi di web dan Discord pada waktu yang dipilih.
      </p>
    </Card>
  );
}
