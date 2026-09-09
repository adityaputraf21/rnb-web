# RnB Web

Next.js (App Router) + Prisma. Termasuk **integrasi Discord penuh** (webhook keluar
+ slash command masuk via HTTP Interactions) yang jalan 100% di Vercel — tanpa bot
gateway, tanpa Railway/VPS.

## Quick start

```bash
npm install
cp .env.example .env.local          # isi DATABASE_URL + kredensial Discord
npm run db:push                     # buat tabel di database
npm run dev                         # http://localhost:3000
```

## Integrasi Discord

Panduan lengkap: [docs/discord-integration.md](docs/discord-integration.md).

Ringkas:

1. Buat Discord App, isi `DISCORD_*` env (lihat `.env.example`).
2. Buat webhook per channel → `DISCORD_WEBHOOK_*`.
3. `npm run discord:register` (atau `:global`) untuk daftar slash command.
4. Deploy ke Vercel, set Interactions Endpoint URL ke
   `https://<domain>/api/discord/interactions`.

### Endpoint

| Route | Fungsi |
|-------|--------|
| `POST /api/discord/interactions` | Terima slash command Discord (`/announce`, `/event`) — verifikasi signature, insert DB, balas |
| `POST /api/announcements` | Buat pengumuman dari web + notif Discord |
| `POST /api/events` | Buat event dari web + notif Discord |
| `POST /api/forum` | Buat thread forum + notif Discord |
| `POST /api/leaderboard` | Tambah poin user; notif Discord saat naik tier |

### Contoh

```bash
curl -X POST http://localhost:3000/api/announcements \
  -H 'content-type: application/json' \
  -d '{"title":"Maintenance","body":"Server down 22:00-23:00","authorName":"admin"}'

curl -X POST http://localhost:3000/api/leaderboard \
  -H 'content-type: application/json' \
  -d '{"username":"budi","delta":600}'
```

## Deploy ke Vercel

1. Import repo di Vercel.
2. Set semua env dari `.env.example` (Production + Preview).
3. Build command default (`npm run build`) sudah menjalankan `prisma generate`.
4. Setelah deploy pertama, pasang Interactions Endpoint URL di Discord portal.
