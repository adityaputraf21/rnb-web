import { NextResponse } from "next/server";
import {
  verifyDiscordRequest,
  getOption,
  sendDiscordWebhook,
  announcementEmbed,
  eventEmbed,
  InteractionType,
  InteractionResponseType,
  EPHEMERAL,
} from "@/lib/discord";
// Ganti sesuai layer DB kamu (Prisma / Drizzle / Supabase / dll).
import { prisma } from "@/lib/prisma";
import { firstImageUrl, toPlainExcerpt } from "@/lib/md-extract";

/**
 * ============================================================================
 * app/api/discord/interactions/route.ts
 * ----------------------------------------------------------------------------
 * Endpoint tunggal "Interactions Endpoint URL" di Discord Developer Portal:
 *
 *   https://<domain-vercel-kamu>/api/discord/interactions
 *
 * Alur:
 *   1. Discord kirim POST + signature Ed25519
 *   2. Verifikasi signature (WAJIB, kalau gagal -> 401)
 *   3. type === 1 (PING)  -> balas PONG (dipakai saat "Save Changes" di portal)
 *   4. type === 2 (COMMAND) -> proses /announce atau /event
 *
 * Catatan runtime:
 *   - Pakai Node.js runtime (bukan edge) supaya kompatibel dgn Prisma & crypto.
 *   - Discord kasih deadline 3 detik. Insert DB sederhana masih aman.
 *     Kalau prosesnya berat, balas DEFERRED (type 5) lalu PATCH follow-up.
 * ============================================================================
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Helper bikin JSON response tipe 4 (pesan langsung). */
function reply(content: string, opts: { ephemeral?: boolean } = {}) {
  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: opts.ephemeral ? EPHEMERAL : 0,
      allowed_mentions: { parse: [] },
    },
  });
}

export async function POST(req: Request) {
  /* --- 1 & 2: verifikasi signature ---------------------------------------- */
  const { isValid, rawBody } = await verifyDiscordRequest(req);
  if (!isValid) {
    return new NextResponse("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  /* --- 3: PING / PONG ---------------------------------------------------- */
  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  /* --- 4: slash command ------------------------------------------------- */
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const data = interaction.data;
    const commandName: string = data.name;

    // Siapa yang manggil (untuk audit / field "Oleh").
    const discordUser = interaction.member?.user ?? interaction.user;
    const invoker =
      discordUser?.global_name ?? discordUser?.username ?? "discord";

    // Cocokkan ke akun website lewat discordId (kalau sudah pernah login).
    const linked = discordUser?.id
      ? await prisma.user.findUnique({
          where: { discordId: discordUser.id },
          select: { id: true, role: true },
        })
      : null;
    const authorId =
      linked && linked.role !== "USER" ? linked.id : null;

    try {
      switch (commandName) {
        /* ---------------- /announce ---------------- */
        case "announce": {
          const judul = getOption(data, "judul")?.trim();
          const isi = getOption(data, "isi")?.trim();

          if (!judul || !isi) {
            return reply("❌ `judul` dan `isi` wajib diisi.", {
              ephemeral: true,
            });
          }

          const announcement = await prisma.announcement.create({
            data: {
              title: judul,
              body: isi,
              source: "discord",
              authorId,
              authorName: invoker,
            },
          });

          // Kirim juga ke channel pengumuman (webhook keluar) biar konsisten
          // dengan pengumuman yang dibuat dari web.
          await sendDiscordWebhook({
            category: "announcement",
            embed: announcementEmbed({
              id: announcement.id,
              title: announcement.title,
              body: toPlainExcerpt(announcement.body, 1500),
              authorName: invoker,
              imageUrl: firstImageUrl(announcement.body),
            }),
          });

          return reply(
            `✅ Pengumuman **${judul}** berhasil dibuat (ID: \`${announcement.id}\`).`,
            { ephemeral: true },
          );
        }

        /* ---------------- /event ---------------- */
        case "event": {
          const judul = getOption(data, "judul")?.trim();
          const tanggalRaw = getOption(data, "tanggal")?.trim();
          const deskripsi = getOption(data, "deskripsi")?.trim() ?? null;

          if (!judul || !tanggalRaw) {
            return reply("❌ `judul` dan `tanggal` wajib diisi.", {
              ephemeral: true,
            });
          }

          // Terima "2026-10-01" atau "2026-10-01 19:00". Simpan string asli
          // juga supaya tampil apa adanya kalau parsing gagal.
          const parsed = new Date(tanggalRaw);
          const isValidDate = !Number.isNaN(parsed.getTime());

          const event = await prisma.event.create({
            data: {
              title: judul,
              description: deskripsi,
              startsAt: isValidDate ? parsed : null,
              dateLabel: tanggalRaw,
              source: "discord",
              authorId,
              createdByName: invoker,
            },
          });

          await sendDiscordWebhook({
            category: "event",
            embed: eventEmbed({
              id: event.id,
              title: event.title,
              date: tanggalRaw,
              description: deskripsi ? toPlainExcerpt(deskripsi, 1500) : undefined,
              imageUrl: deskripsi ? firstImageUrl(deskripsi) : undefined,
            }),
          });

          return reply(
            `✅ Event **${judul}** (${tanggalRaw}) berhasil dibuat (ID: \`${event.id}\`).`,
            { ephemeral: true },
          );
        }

        /* ---------------- /leaderboard ---------------- */
        case "leaderboard": {
          const top = await prisma.user.findMany({
            where: { bannedAt: null },
            orderBy: { points: "desc" },
            take: 10,
            select: { username: true, name: true, points: true, tier: true },
          });
          const lines = top
            .map(
              (u, i) =>
                `**${i + 1}.** ${u.name ?? u.username} — ${u.points} poin · ${u.tier}`,
            )
            .join("\n");
          return reply(`🏆 **Leaderboard**\n${lines || "Belum ada data."}`, {
            ephemeral: true,
          });
        }

        /* ---------------- /rank ---------------- */
        case "rank": {
          if (!linked) {
            return reply(
              "Akunmu belum tertaut. Login dulu di website pakai Discord, lalu coba lagi.",
              { ephemeral: true },
            );
          }
          const u = await prisma.user.findUnique({
            where: { id: linked.id },
            select: { username: true, points: true, tier: true },
          });
          if (!u) return reply("User tidak ditemukan.", { ephemeral: true });
          const higher = await prisma.user.count({
            where: { points: { gt: u.points } },
          });
          return reply(
            `📊 **@${u.username}** — peringkat **#${higher + 1}**, ${u.points} poin, tier **${u.tier}**`,
            { ephemeral: true },
          );
        }

        /* ---------------- /profile ---------------- */
        case "profile": {
          const uname = getOption(data, "username")?.trim().toLowerCase();
          const u = uname
            ? await prisma.user.findUnique({
                where: { username: uname },
                select: {
                  username: true,
                  name: true,
                  points: true,
                  tier: true,
                  bio: true,
                  _count: { select: { threads: true, posts: true, statuses: true } },
                },
              })
            : null;
          if (!u)
            return reply(`User \`${uname}\` tidak ditemukan.`, { ephemeral: true });
          const site =
            process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb.web";
          return reply(
            `👤 **${u.name ?? u.username}** (@${u.username})\n` +
              `${u.tier} · ${u.points} poin · ${u._count.threads} thread · ${u._count.posts} balasan · ${u._count.statuses} status\n` +
              (u.bio ? `> ${u.bio.slice(0, 150)}\n` : "") +
              `${site}/u/${u.username}`,
            { ephemeral: true },
          );
        }

        default:
          return reply(`❓ Command \`/${commandName}\` tidak dikenal.`, {
            ephemeral: true,
          });
      }
    } catch (err) {
      console.error(`[discord] error proses /${commandName}:`, err);
      return reply(
        "⚠️ Terjadi kesalahan di server saat memproses command.",
        { ephemeral: true },
      );
    }
  }

  // Tipe interaction lain (component/modal) belum dipakai.
  return new NextResponse("unhandled interaction type", { status: 400 });
}

// Discord hanya POST ke endpoint ini. GET dibuat 405 biar jelas.
export function GET() {
  return new NextResponse("method not allowed", { status: 405 });
}
