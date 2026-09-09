# Integrasi Discord (Webhook + Slash Command via HTTP)

100% jalan di dalam project Next.js ini, deploy bareng ke Vercel. **Tanpa** bot
gateway, tanpa Railway/VPS, tanpa proses yang selalu nyala.

| Arah | Mekanisme | File |
|------|-----------|------|
| Keluar (web → Discord) | Discord Webhook + Embed | `lib/discord.ts` → `sendDiscordWebhook()` |
| Masuk (Discord → web) | HTTP Interactions Endpoint | `app/api/discord/interactions/route.ts` |
| Registrasi command | REST API, sekali jalan manual | `scripts/register-commands.js` |

---

## 1. Setup Discord App (sekali)

1. https://discord.com/developers/applications → **New Application**.
2. Tab **General Information**: catat **Application ID** + **Public Key**.
3. Tab **Bot**: **Reset Token** → catat sebagai `DISCORD_BOT_TOKEN`.
   (Token dipakai hanya untuk register command & mengirim reply lewat REST —
   bukan untuk koneksi gateway.)
4. Isi semua env di `.env.local` (lihat `.env.example`), lalu set env yang sama
   di **Vercel → Project → Settings → Environment Variables**.

## 2. Buat webhook per channel

Server Settings → Integrations → Webhooks → New Webhook → pilih channel → Copy
Webhook URL. Ulangi untuk forum / event / leaderboard / announcement, masukkan
ke `DISCORD_WEBHOOK_*`.

## 3. Daftarkan slash command

```bash
# guild (langsung muncul, buat dev)
node scripts/register-commands.js

# global (semua server, propagasi ~1 jam)
node scripts/register-commands.js --global
```

## 4. Pasang Interactions Endpoint URL

Setelah deploy ke Vercel, di Developer Portal → **General Information** →
**Interactions Endpoint URL**:

```
https://<domain-vercel-kamu>/api/discord/interactions
```

Klik **Save Changes**. Discord akan kirim PING; route sudah membalas PONG +
verifikasi signature, jadi validasi langsung lolos.

---

## 5. Memanggil webhook keluar dari kode

Panggil `sendDiscordWebhook()` di titik-titik berikut (contoh Prisma / server action):

```ts
import {
  sendDiscordWebhook,
  forumThreadEmbed,
  leaderboardTierEmbed,
} from "@/lib/discord";

// -- Thread forum baru --
await sendDiscordWebhook({
  category: "forum",
  embed: forumThreadEmbed({
    id: thread.id,
    title: thread.title,
    authorName: user.name,
    categoryName: category.name,
    excerpt: thread.body.slice(0, 300),
  }),
});

// -- User naik tier leaderboard --
await sendDiscordWebhook({
  category: "leaderboard",
  embed: leaderboardTierEmbed({
    username: user.name,
    fromTier: "Silver",
    toTier: "Gold",
    rank: 4,
  }),
});
```

`sendDiscordWebhook()` tidak pernah `throw` — kalau Discord down, alur utama
tetap jalan dan hanya menulis warning ke log.

Warna embed otomatis per kategori (`lib/discord.ts` → `DISCORD_COLORS`):

- `forum` → blurple `#5865F2`
- `event` → hijau `#57F287`
- `leaderboard` → kuning `#FEE75C`
- `announcement` → pink `#EB459E`

---

## 6. Skema DB yang diasumsikan

Route interactions memakai model berikut — sesuaikan dengan schema-mu:

```prisma
model Announcement {
  id         String   @id @default(cuid())
  title      String
  body       String
  source     String   @default("web")   // "web" | "discord"
  authorName String?
  createdAt  DateTime @default(now())
}

model Event {
  id            String    @id @default(cuid())
  title         String
  description   String?
  startsAt      DateTime?
  dateLabel     String                       // string tanggal asli dari command
  source        String    @default("web")
  createdByName String?
  createdAt     DateTime  @default(now())
}
```

---

## 7. Dependency

```bash
npm i discord-interactions
npm i -D dotenv   # opsional, untuk register-commands.js
```

`discord-interactions` dipakai untuk `verifyKey` (verifikasi signature Ed25519).
