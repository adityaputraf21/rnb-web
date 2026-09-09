import { CalendarDays, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { fullDate } from "@/lib/format";

export const metadata = { title: "Event" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const events = await prisma.event.findMany({
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const upcoming = events.filter((e) => !e.startsAt || e.startsAt >= now);
  const past = events.filter((e) => e.startsAt && e.startsAt < now).reverse();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Event</h1>
        </div>
        {hasRole(user, "MODERATOR") && <CreateEventDialog />}
      </div>

      <Section title="Akan datang" events={upcoming} empty="Belum ada event terjadwal." />
      {past.length > 0 && <Section title="Sudah lewat" events={past} empty="" muted />}
    </div>
  );
}

function Section({
  title,
  events,
  empty,
  muted,
}: {
  title: string;
  events: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    dateLabel: string;
    startsAt: Date | null;
    createdByName: string | null;
  }[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {events.length === 0 && empty && (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
      {events.map((e) => (
        <Card key={e.id} className={muted ? "opacity-70" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{e.title}</h3>
              <Badge variant="secondary">
                {e.startsAt ? fullDate(e.startsAt) : e.dateLabel}
              </Badge>
            </div>
            {e.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {e.location}
              </p>
            )}
            {e.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {e.description}
              </p>
            )}
            {e.createdByName && (
              <p className="mt-2 text-xs text-muted-foreground">
                oleh {e.createdByName}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
