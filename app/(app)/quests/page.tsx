import { notFound } from "next/navigation";
import { Swords, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config";
import { questProgress } from "@/lib/quests";
import { QuestList } from "@/components/quests/quest-list";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Quest" };
export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user = await requireUser("/quests");
  const cfg = await getSiteConfig();
  if (!cfg.questsEnabled) notFound();

  const [{ weekly, seasonal, season }, awards] = await Promise.all([
    questProgress(user.id),
    prisma.seasonAward.findMany({
      where: { userId: user.id },
      orderBy: { season: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Swords className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Quest</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Mingguan</h2>
        <p className="text-xs text-muted-foreground">
          Reset tiap Senin. Selesaikan lalu klaim poinnya.
        </p>
        <QuestList quests={weekly} />
      </section>

      {awards.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-yellow-500" /> Penghargaan musim
          </h2>
          <Card className="divide-y">
            {awards.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 text-sm"
              >
                <span>Musim {a.season}</span>
                <span className="font-medium">
                  Peringkat #{a.rank} · +{a.points} poin
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Musim {season}</h2>
        <p className="text-xs text-muted-foreground">
          Target besar sepanjang ~13 minggu.
        </p>
        <QuestList quests={seasonal} />
      </section>
    </div>
  );
}
