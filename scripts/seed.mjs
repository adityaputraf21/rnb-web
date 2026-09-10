/**
 * Seed data awal:
 *  - kategori forum default
 *  - jadikan ADMIN akun dengan email di ADMIN_EMAIL (kalau sudah pernah login)
 *
 * Jalankan: node scripts/seed.mjs
 */
import { PrismaClient } from "@prisma/client";

try {
  (await import("dotenv")).config({ path: ".env.local" });
  (await import("dotenv")).config({ path: ".env" });
} catch {}

const prisma = new PrismaClient();
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "adityaputraferdiansyah21@gmail.com";

const CATEGORIES = [
  { name: "Pengumuman & Aturan", slug: "pengumuman", color: "#EB459E", description: "Info resmi dari tim RnB.", position: 0 },
  { name: "Diskusi Umum", slug: "umum", color: "#5865F2", description: "Ngobrol bebas seputar komunitas.", position: 1 },
  { name: "Tanya Jawab", slug: "tanya-jawab", color: "#57F287", description: "Butuh bantuan? Tanya di sini.", position: 2 },
  { name: "Karya & Showcase", slug: "showcase", color: "#FEE75C", description: "Pamer project, desain, tulisan.", position: 3 },
];

for (const c of CATEGORIES) {
  await prisma.category.upsert({
    where: { slug: c.slug },
    update: { name: c.name, color: c.color, description: c.description, position: c.position },
    create: c,
  });
  console.log("kategori:", c.slug);
}

await prisma.siteConfig.upsert({
  where: { id: "singleton" },
  update: {},
  create: { id: "singleton" },
});
console.log("site config OK");

const WIKI = [
  {
    slug: "aturan-komunitas",
    title: "Aturan Komunitas",
    body: `# Aturan Komunitas RnB

Ringkas saja:

1. **Hormati satu sama lain.** Tidak ada pelecehan, ujaran kebencian, atau serangan pribadi.
2. **Jaga konten tetap aman.** Dilarang konten seksual eksplisit, kekerasan berlebihan, atau ilegal.
3. **Jangan spam.** Termasuk promosi berlebihan dan iklan berulang di Pasar.
4. **Satu akun per orang.**
5. **Pakai fitur dengan benar.** Wiki untuk info bermanfaat, bukan corat-coret.

Pelanggaran bisa berujung peringatan, timeout, atau blokir. Kamu bisa mengajukan banding kalau merasa keliru.

Lihat juga [Ketentuan Layanan](/terms) dan [Kebijakan Privasi](/privacy).`,
  },
  {
    slug: "faq",
    title: "FAQ",
    body: `# Pertanyaan Umum

## Bagaimana cara login?
Klik "Masuk" lalu otorisasi dengan akun Discord. Username & avatar diambil otomatis (bisa diubah di Pengaturan).

## Bagaimana cara dapat poin?
Buat thread, balas diskusi, posting status, selesaikan quest, login harian (streak), dan undang teman.

## Apa itu tier?
Level berdasarkan total poin. Makin tinggi tier, makin banyak badge.

## Story hilang ke mana?
Story otomatis terhapus setelah 24 jam. Simpan yang penting ke Highlight.

## Panggilan video tidak nyambung?
Beberapa jaringan (WiFi kantor/kampus) memblokir koneksi langsung. Coba jaringan lain atau pakai data seluler.`,
  },
  {
    slug: "panduan-fitur",
    title: "Panduan Fitur",
    body: `# Panduan Fitur

- **Feed** — status singkat, foto, video, polling. Tab "Untukmu" menyesuaikan dengan minatmu.
- **Forum** — diskusi terstruktur per kategori. Tandai jawaban terbaik di thread tanya-jawab.
- **Stories** — momen 24 jam. Bisa khusus Close Friends.
- **Pesan** — DM 1-on-1, grup chat, voice note, panggilan suara/video.
- **Pasar** — jual-beli antar anggota. RnB tidak ikut campur transaksi — hati-hati.
- **Wiki** — halaman yang bisa disunting siapa saja, lengkap dengan riwayat.
- **Quest** — tantangan mingguan & musiman untuk poin bonus.
- **Event** — agenda komunitas, RSVP, ekspor ke kalender.`,
  },
];

for (const w of WIKI) {
  const existing = await prisma.wikiPage.findUnique({ where: { slug: w.slug } });
  if (existing) {
    console.log("wiki (skip, sudah ada):", w.slug);
    continue;
  }
  await prisma.wikiPage.create({
    data: {
      slug: w.slug,
      title: w.title,
      body: w.body,
      revisions: {
        create: { title: w.title, body: w.body, summary: "Dibuat saat seed" },
      },
    },
  });
  console.log("wiki:", w.slug);
}

const owner = await prisma.user.findFirst({ where: { email: ADMIN_EMAIL } });
if (owner) {
  await prisma.user.update({ where: { id: owner.id }, data: { role: "OWNER" } });
  console.log(`OWNER: ${owner.username} (${ADMIN_EMAIL})`);
} else {
  console.log(
    `Belum ada user ${ADMIN_EMAIL}. Login dulu lewat Discord, lalu jalankan ulang script ini.`,
  );
}

await prisma.$disconnect();
