import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";
import { sendEmail, emailEnabled } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb.web";

export async function weeklyDigest() {
  const since = new Date(Date.now() - 7 * 86400000);

  const [threads, statuses, newUsers, newThreads, newPosts] = await Promise.all([
    prisma.thread.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      orderBy: { posts: { _count: "desc" } },
      take: 5,
      include: {
        category: { select: { slug: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.status.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      orderBy: { likes: { _count: "desc" } },
      take: 5,
      include: {
        author: { select: { username: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.thread.count({
      where: { createdAt: { gte: since }, deletedAt: null },
    }),
    prisma.post.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
  ]);

  const threadLines = threads
    .map(
      (t, i) =>
        `${i + 1}. [${t.title}](${SITE_URL}/forum/${t.category.slug}/${t.slug}) — ${t._count.posts} balasan`,
    )
    .join("\n");
  const statusLines = statuses
    .map(
      (s, i) =>
        `${i + 1}. [@${s.author?.username ?? "?"}](${SITE_URL}/feed/${s.id}) — ${s._count.likes} suka`,
    )
    .join("\n");

  await sendDiscordWebhook({
    category: "announcement",
    embed: {
      author: { name: "📊 Rekap Mingguan RnB" },
      title: "Sepekan terakhir",
      description: [
        `**${newUsers}** anggota baru · **${newThreads}** thread · **${newPosts}** balasan`,
        "",
        threadLines ? `**Thread teramai**\n${threadLines}` : "",
        "",
        statusLines ? `**Status terpopuler**\n${statusLines}` : "",
      ]
        .filter((l) => l !== "")
        .join("\n"),
    },
  });

  let emailed = 0;
  if (emailEnabled()) {
    const subs = await prisma.user.findMany({
      where: { notifyEmailDigest: true, email: { not: null } },
      select: { email: true },
      take: 500,
    });
    const topThreads = threads
      .map(
        (t) =>
          `<li><a href="${SITE_URL}/forum/${t.category.slug}/${t.slug}">${t.title}</a> — ${t._count.posts} balasan</li>`,
      )
      .join("");
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
        <h2>Rekap Mingguan RnB</h2>
        <p>${newUsers} anggota baru · ${newThreads} thread · ${newPosts} balasan minggu ini.</p>
        ${topThreads ? `<h3>Thread teramai</h3><ul>${topThreads}</ul>` : ""}
        <p><a href="${SITE_URL}/feed">Buka RnB →</a></p>
        <p style="color:#888;font-size:12px">Matikan email ini di Pengaturan → Notifikasi.</p>
      </div>`;
    for (const s of subs) {
      if (s.email && (await sendEmail({ to: s.email, subject: "Rekap Mingguan RnB", html })))
        emailed += 1;
    }
  }

  return { newUsers, newThreads, newPosts, threads: threads.length, emailed };
}
