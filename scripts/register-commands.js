/**
 * ============================================================================
 * scripts/register-commands.js
 * ----------------------------------------------------------------------------
 * Script SEKALI-JALAN untuk mendaftarkan (upsert) slash command ke Discord.
 * Tidak perlu jalan di production. Cukup dijalankan manual dari lokal setiap
 * kali definisi command berubah.
 *
 * Jalankan:
 *   node scripts/register-commands.js            # daftar ke 1 guild (instan)
 *   node scripts/register-commands.js --global   # daftar global (propagasi ~1 jam)
 *
 * Butuh env (baca dari .env.local / .env):
 *   DISCORD_APPLICATION_ID
 *   DISCORD_BOT_TOKEN
 *   DISCORD_DEV_GUILD_ID   (hanya untuk mode guild / non-global)
 *
 * Tidak ada dependency selain Node >= 18 (pakai fetch bawaan).
 * Loader .env pakai `node --env-file` kalau tersedia, atau dotenv kalau ada.
 * ============================================================================
 */

// Coba muat .env.local lalu .env (opsional — abaikan kalau dotenv tidak ada).
try {
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config({ path: ".env" });
} catch {
  // Tidak apa-apa. Bisa juga jalankan: node --env-file=.env.local scripts/register-commands.js
}

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_DEV_GUILD_ID;

const isGlobal = process.argv.includes("--global");

if (!APPLICATION_ID || !BOT_TOKEN) {
  console.error(
    "❌ DISCORD_APPLICATION_ID dan DISCORD_BOT_TOKEN wajib diset di .env.local",
  );
  process.exit(1);
}
if (!isGlobal && !GUILD_ID) {
  console.error(
    "❌ Mode guild butuh DISCORD_DEV_GUILD_ID. Atau pakai flag --global.",
  );
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/*  Definisi command                                                          */
/*  type 3 = STRING option                                                    */
/* -------------------------------------------------------------------------- */

const commands = [
  {
    name: "announce",
    description: "Buat pengumuman baru di website",
    type: 1, // CHAT_INPUT
    options: [
      {
        name: "judul",
        description: "Judul pengumuman",
        type: 3,
        required: true,
      },
      {
        name: "isi",
        description: "Isi / body pengumuman",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "event",
    description: "Buat event baru di website",
    type: 1,
    options: [
      {
        name: "judul",
        description: "Nama event",
        type: 3,
        required: true,
      },
      {
        name: "tanggal",
        description: "Tanggal event, mis. 2026-10-01 atau 2026-10-01 19:00",
        type: 3,
        required: true,
      },
      {
        name: "deskripsi",
        description: "Deskripsi event (opsional)",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "leaderboard",
    description: "Lihat 10 besar leaderboard komunitas",
    type: 1,
  },
  {
    name: "rank",
    description: "Lihat peringkat & poin kamu (akun harus sudah login di web)",
    type: 1,
  },
  {
    name: "profile",
    description: "Lihat profil singkat seorang member",
    type: 1,
    options: [
      {
        name: "username",
        description: "Username di website",
        type: 3,
        required: true,
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */

const url = isGlobal
  ? `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`
  : `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`;

async function main() {
  console.log(
    `→ Mendaftarkan ${commands.length} command (${
      isGlobal ? "GLOBAL" : `guild ${GUILD_ID}`
    })...`,
  );

  // PUT = bulk overwrite: daftar ini jadi sumber kebenaran tunggal.
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    console.error(`❌ Gagal (${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("✅ Berhasil. Command terdaftar:");
  for (const c of body) {
    console.log(`   /${c.name} — ${c.description}`);
  }
  if (isGlobal) {
    console.log("\nℹ️  Command global bisa butuh hingga ~1 jam untuk muncul.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
