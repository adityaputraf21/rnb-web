"use client";

import * as React from "react";
import { Calendar, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface InviteReminderProps {
  scheduledFor: Date | null;
}

export function InviteReminder({ scheduledFor }: InviteReminderProps) {
  const [loading, setLoading] = React.useState(false);
  const [date, setDate] = React.useState<string>(
    scheduledFor ? scheduledFor.toISOString().split("T")[0] : "",
  );
  const [set, setSet] = React.useState(!!scheduledFor);

  async function handleSetReminder() {
    if (!date) {
      toast.error("Pilih tanggal dulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scheduledFor: new Date(`${date}T00:00:00Z`) }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Gagal set reminder");
        return;
      }

      setSet(true);
      toast.success("Reminder dijadwalkan!");
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
        <h2 className="font-semibold">Pengingat Invitation</h2>
      </div>

      {set && scheduledFor && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <Check className="h-4 w-4" />
          <span>
            Reminder dijadwalkan untuk{" "}
            <strong>
              {formatDate(scheduledFor, "EEEE, dd MMMM yyyy", {
                locale: idLocale,
              })}
            </strong>
          </span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          Atur tanggal pengingat Discord invitation
        </label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="flex-1"
            />
          </div>
          <Button
            onClick={handleSetReminder}
            disabled={loading}
            variant={set ? "outline" : "default"}
          >
            {loading ? "..." : set ? "Ubah" : "Set"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Kamu akan dapat notifikasi di web dan Discord pada tanggal yang dipilih.
      </p>
    </Card>
  );
}
