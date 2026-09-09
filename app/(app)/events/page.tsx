import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { EventItem, type EventView } from "@/components/event-item";
import { fullDate } from "@/lib/format";

export const metadata = { title: "Event" };
export const dynamic = "force-dynamic";

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default async function EventsPage() {
  const user = await getCurrentUser();
  const canManage = hasRole(user, "MODERATOR");
  const now = new Date();

  const events = await prisma.event.findMany({
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      rsvps: {
        select: { status: true, userId: true },
      },
    },
  });

  const toView = (e: (typeof events)[number]): EventView => {
    const rsvpCounts = { going: 0, maybe: 0, no: 0 };
    let myRsvp: string | null = null;
    for (const r of e.rsvps) {
      if (r.status in rsvpCounts)
        rsvpCounts[r.status as keyof typeof rsvpCounts]++;
      if (user && r.userId === user.id) myRsvp = r.status;
    }
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      dateLabel: e.dateLabel,
      dateInput: toDateInput(e.startsAt),
      whenLabel: e.startsAt ? fullDate(e.startsAt) : e.dateLabel,
      createdByName: e.createdByName,
      past: !!e.startsAt && e.startsAt < now,
      myRsvp,
      rsvpCounts,
    };
  };

  const upcoming = events.filter((e) => !e.startsAt || e.startsAt >= now).map(toView);
  const past = events
    .filter((e) => e.startsAt && e.startsAt < now)
    .reverse()
    .map(toView);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Event</h1>
        </div>
        {canManage && <CreateEventDialog />}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Akan datang</h2>
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada event terjadwal.
          </p>
        )}
        {upcoming.map((e) => (
          <EventItem
            key={e.id}
            e={e}
            canManage={canManage}
            loggedIn={!!user}
          />
        ))}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Sudah lewat</h2>
          {past.map((e) => (
            <EventItem
            key={e.id}
            e={e}
            canManage={canManage}
            loggedIn={!!user}
          />
          ))}
        </div>
      )}
    </div>
  );
}
