import { redirect } from "next/navigation";
import {
  Newspaper,
  MessagesSquare,
  Trophy,
  CalendarDays,
  Camera,
  Mail,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInButton } from "@/components/sign-in-button";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Newspaper, title: "Feed", desc: "Posting status, foto, video, polling — timeline komunitas." },
  { icon: Camera, title: "Stories", desc: "Bagikan momen yang hilang otomatis setelah 24 jam." },
  { icon: MessagesSquare, title: "Forum", desc: "Diskusi mendalam: thread, balasan, jawaban terbaik." },
  { icon: Mail, title: "Pesan langsung", desc: "Chat pribadi dengan siapa pun di komunitas." },
  { icon: Trophy, title: "Leaderboard", desc: "Kumpulkan poin dari aktivitas, naik tier sampai Legend." },
  { icon: CalendarDays, title: "Event & Pengumuman", desc: "Semua info penting, tersambung ke Discord." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  const [memberCount, threadCount] = await Promise.all([
    prisma.user.count(),
    prisma.thread.count({ where: { deletedAt: null } }),
  ]).catch(() => [0, 0]);

  return (
    <div className="space-y-16">
      <section className="flex flex-col items-center gap-6 py-16 text-center">
        <Badge variant="secondary" className="gap-1">
          <span className="text-primary">●</span> Rise Never Break
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Rumah komunitas RnB
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Feed, stories, forum, pesan langsung, event, dan leaderboard dalam satu
          tempat — tersambung ke server Discord.
        </p>
        <SignInButton size="lg" callbackUrl="/feed" />
        <p className="text-sm text-muted-foreground">
          {memberCount} member · {threadCount} thread · masuk pakai Discord
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-5">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Gabung sekarang</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Login sekali pakai akun Discord — username & avatar otomatis.
        </p>
        <div className="mt-4">
          <SignInButton callbackUrl="/feed" />
        </div>
      </section>
    </div>
  );
}
