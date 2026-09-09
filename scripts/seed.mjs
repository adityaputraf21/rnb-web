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
