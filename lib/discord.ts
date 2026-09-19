import { verifyKey } from "discord-interactions";

/**
 * ============================================================================
 * lib/discord.ts
 * ----------------------------------------------------------------------------
 * Semua util Discord dipakai 2 arah:
 *  1. KELUAR  -> sendDiscordWebhook(): website mengirim notifikasi ke channel
 *  2. MASUK   -> verifyDiscordRequest(): verifikasi signature slash command
 *
 * Tidak ada bot gateway. Semuanya HTTP biasa, aman jalan di Vercel serverless.
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/*  Warna embed per kategori (integer, bukan hex string)                       */
/* -------------------------------------------------------------------------- */

export const DISCORD_COLORS = {
  forum: 0x5865f2, // biru blurple  -> thread forum baru
  event: 0x57f287, // hijau         -> event baru
  leaderboard: 0xfee75c, // kuning  -> user naik tier / rank
  announcement: 0xeb459e, // pink   -> pengumuman baru
  modlog: 0xed4245, // merah        -> aksi moderasi
} as const;

export type DiscordCategory = keyof typeof DISCORD_COLORS;

/* -------------------------------------------------------------------------- */
/*  Mapping kategori -> env var webhook URL                                    */
/* -------------------------------------------------------------------------- */

const WEBHOOK_ENV: Record<DiscordCategory, string> = {
  forum: "DISCORD_WEBHOOK_FORUM",
  event: "DISCORD_WEBHOOK_EVENT",
  leaderboard: "DISCORD_WEBHOOK_LEADERBOARD",
  announcement: "DISCORD_WEBHOOK_ANNOUNCEMENT",
  modlog: "DISCORD_WEBHOOK_MODLOG",
};

/* -------------------------------------------------------------------------- */
/*  Tipe embed minimal (subset dari Discord API)                               */
/* -------------------------------------------------------------------------- */

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  fields?: DiscordEmbedField[];
  author?: { name: string; url?: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
}

export interface SendWebhookOptions {
  /** Kategori menentukan warna default + webhook URL yang dipakai. */
  category: DiscordCategory;
  /** Teks di luar embed (opsional). */
  content?: string;
  /** Satu / beberapa embed. Kalau kosong, dipakai `embed` tunggal. */
  embeds?: DiscordEmbed[];
  embed?: DiscordEmbed;
  /** Override nama & avatar webhook. */
  username?: string;
  avatarUrl?: string;
  /** Override URL webhook secara manual (kalau tidak mau lewat env). */
  webhookUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*  1. KELUAR: kirim notifikasi ke Discord lewat webhook                       */
/* -------------------------------------------------------------------------- */

/**
 * Kirim pesan embed ke channel Discord.
 *
 * Aman dipanggil dari server action / route handler / cron. Fungsi ini
 * TIDAK pernah throw supaya alur utama (misal "buat event") tidak gagal
 * hanya karena Discord down. Kembalikan boolean sukses/tidak.
 *
 * @example
 * await sendDiscordWebhook({
 *   category: "forum",
 *   embed: {
 *     title: "Thread baru: Cara setup Vercel",
 *     url: "https://rnb.web/forum/123",
 *     description: "Dibuat oleh @budi di kategori Tanya Jawab",
 *   },
 * });
 */
export async function sendDiscordWebhook(
  options: SendWebhookOptions,
): Promise<boolean> {
  const { category, content, webhookUrl: manualUrl } = options;

  const url = manualUrl ?? process.env[WEBHOOK_ENV[category]];
  if (!url) {
    console.warn(
      `[discord] webhook URL untuk kategori "${category}" tidak diset (${WEBHOOK_ENV[category]}). Notifikasi dilewati.`,
    );
    return false;
  }

  // Nama & avatar: pakai yang di-pass, kalau tidak ambil dari setelan situs.
  let username = options.username;
  let avatarUrl = options.avatarUrl;
  if (!username || avatarUrl === undefined) {
    try {
      const { getSiteConfig } = await import("@/lib/site-config");
      const cfg = await getSiteConfig();
      username ??= cfg.webhookUsername || "RnB";
      avatarUrl ??= cfg.webhookAvatar ?? undefined;
    } catch {
      username ??= "RnB";
    }
  }

  // Normalisasi embeds + inject warna default kalau belum diisi.
  const rawEmbeds =
    options.embeds ?? (options.embed ? [options.embed] : []);
  const embeds = rawEmbeds.map((e) => ({
    color: DISCORD_COLORS[category],
    timestamp: new Date().toISOString(),
    ...e,
  }));

  try {
    const res = await fetch(`${url}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        avatar_url: avatarUrl,
        content,
        embeds,
        // Cegah mention massal dari isi user.
        allowed_mentions: { parse: [] },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[discord] webhook gagal (${res.status}) kategori=${category}: ${body}`,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[discord] webhook error kategori=${category}:`, err);
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Helper embed siap-pakai per event                                         */
/* -------------------------------------------------------------------------- */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rnb.web";

export function forumThreadEmbed(t: {
  id: string | number;
  title: string;
  authorName: string;
  categoryName?: string;
  excerpt?: string;
  path?: string;
  imageUrl?: string;
}): DiscordEmbed {
  return {
    author: { name: "💬 Thread Forum Baru" },
    title: t.title,
    url: `${SITE_URL}${t.path ?? `/forum/${t.id}`}`,
    description: t.excerpt || undefined,
    image: t.imageUrl ? { url: t.imageUrl } : undefined,
    fields: [
      { name: "Penulis", value: t.authorName, inline: true },
      ...(t.categoryName
        ? [{ name: "Kategori", value: t.categoryName, inline: true }]
        : []),
    ],
  };
}

export function eventEmbed(e: {
  id: string | number;
  title: string;
  date: string;
  description?: string;
  imageUrl?: string;
}): DiscordEmbed {
  return {
    author: { name: "📅 Event Baru" },
    title: e.title,
    url: `${SITE_URL}/events/${e.id}`,
    description: e.description || undefined,
    image: e.imageUrl ? { url: e.imageUrl } : undefined,
    fields: [{ name: "Tanggal", value: e.date, inline: true }],
  };
}

export function leaderboardTierEmbed(u: {
  username: string;
  fromTier: string;
  toTier: string;
  rank?: number;
}): DiscordEmbed {
  return {
    author: { name: "🏆 Naik Tier!" },
    title: `${u.username} naik ke ${u.toTier}`,
    description: `Dari **${u.fromTier}** ➜ **${u.toTier}**`,
    fields: u.rank
      ? [{ name: "Peringkat", value: `#${u.rank}`, inline: true }]
      : undefined,
  };
}

export function announcementEmbed(a: {
  id: string | number;
  title: string;
  body: string;
  authorName?: string;
  imageUrl?: string;
}): DiscordEmbed {
  const body = a.body.length > 4000 ? `${a.body.slice(0, 3997)}...` : a.body;
  return {
    author: { name: "📢 Pengumuman Baru" },
    title: a.title,
    url: `${SITE_URL}/announcements/${a.id}`,
    description: body || undefined,
    image: a.imageUrl ? { url: a.imageUrl } : undefined,
    fields: a.authorName
      ? [{ name: "Oleh", value: a.authorName, inline: true }]
      : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  2. MASUK: verifikasi signature request slash command dari Discord          */
/* -------------------------------------------------------------------------- */

export interface VerifyResult {
  isValid: boolean;
  /** Body mentah (string) — sudah dibaca, pakai ini untuk JSON.parse. */
  rawBody: string;
}

/**
 * Verifikasi bahwa request benar-benar datang dari Discord.
 *
 * Discord menandatangani setiap request Interactions dengan Ed25519.
 * Kita cek header `X-Signature-Ed25519` + `X-Signature-Timestamp` terhadap
 * DISCORD_PUBLIC_KEY. Body HARUS dibaca sebagai raw string (bukan parsed JSON)
 * sebelum di-verify.
 *
 * @example
 * const { isValid, rawBody } = await verifyDiscordRequest(req);
 * if (!isValid) return new Response("Bad signature", { status: 401 });
 * const interaction = JSON.parse(rawBody);
 */
export async function verifyDiscordRequest(
  req: Request,
): Promise<VerifyResult> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("[discord] DISCORD_PUBLIC_KEY tidak diset");
    return { isValid: false, rawBody };
  }
  if (!signature || !timestamp) {
    return { isValid: false, rawBody };
  }

  try {
    // verifyKey dari discord-interactions v4 mengembalikan Promise<boolean>
    // (Web Crypto). Untuk v3 ia sinkron — `await` aman untuk keduanya.
    const isValid = await verifyKey(
      rawBody,
      signature,
      timestamp,
      publicKey,
    );
    return { isValid, rawBody };
  } catch (err) {
    console.error("[discord] gagal verifyKey:", err);
    return { isValid: false, rawBody };
  }
}

/* -------------------------------------------------------------------------- */
/*  Helper reply ke Discord (dipakai oleh route interactions)                  */
/* -------------------------------------------------------------------------- */

export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
} as const;

/** Flag 1<<6 = pesan ephemeral (hanya kelihatan si pemanggil command). */
export const EPHEMERAL = 1 << 6;

/**
 * Ambil nilai option string dari payload slash command.
 * `/announce judul:Halo isi:Dunia` -> getOption(data, "judul") === "Halo"
 */
export function getOption(
  data: { options?: Array<{ name: string; value: unknown }> } | undefined,
  name: string,
): string | undefined {
  const opt = data?.options?.find((o) => o.name === name);
  return opt ? String(opt.value) : undefined;
}

export function inviteReminderEmbed(i: {
  code: string;
  inviterName: string;
  scheduledDate: string;
  description?: string;
}): DiscordEmbed {
  return {
    author: { name: "📧 Pengingat Invitation Discord" },
    title: `Invitation dari ${i.inviterName}`,
    description: i.description || "Bergabunglah dengan komunitas RnB di Discord!",
    fields: [
      { name: "Tanggal", value: i.scheduledDate, inline: true },
      { name: "Kode", value: `\`${i.code}\``, inline: true },
    ],
  };
}
