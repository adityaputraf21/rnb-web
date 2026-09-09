import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [announcements, events] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]).catch(() => [[], []] as const);

  return (
    <main>
      <h1>RnB Web</h1>
      <p className="muted">
        Demo integrasi Discord — pengumuman &amp; event bisa dibuat dari web
        maupun lewat slash command Discord.
      </p>

      <section>
        <h2>📢 Pengumuman</h2>
        {announcements.length === 0 && (
          <p className="muted">Belum ada pengumuman.</p>
        )}
        {announcements.map((a) => (
          <article key={a.id} className="card">
            <h3>
              {a.title}
              <span className="tag">{a.source}</span>
            </h3>
            <p>{a.body}</p>
            <p className="muted">
              {a.authorName ?? "anon"} ·{" "}
              {a.createdAt.toLocaleString("id-ID")}
            </p>
          </article>
        ))}
      </section>

      <section>
        <h2>📅 Event</h2>
        {events.length === 0 && <p className="muted">Belum ada event.</p>}
        {events.map((e) => (
          <article key={e.id} className="card">
            <h3>
              {e.title}
              <span className="tag">{e.source}</span>
            </h3>
            <p className="muted">{e.dateLabel}</p>
            {e.description && <p>{e.description}</p>}
          </article>
        ))}
      </section>
    </main>
  );
}
