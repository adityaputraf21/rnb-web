/**
 * Generate PWA / store icons dari SVG pakai sharp.
 * Jalankan: node scripts/gen-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

await mkdir("public", { recursive: true });

const BG = "#5865F2";
const R_PATH =
  "M20 44V20h13a8 8 0 0 1 3 15l6 9h-7l-5-8h-3v8h-6zm6-13h6a3 3 0 0 0 0-6h-6v6z";

// Ikon biasa: bg rounded + huruf besar.
const iconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect width="64" height="64" rx="14" fill="${BG}"/>
  <path d="${R_PATH}" fill="#fff"/>
</svg>`;

// Maskable: bg penuh (tanpa sudut), huruf lebih kecil di zona aman.
const maskableSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect width="64" height="64" fill="${BG}"/>
  <g transform="translate(32 32) scale(0.62) translate(-32 -32)">
    <path d="${R_PATH}" fill="#fff"/>
  </g>
</svg>`;

const jobs = [
  ["public/icon-192.png", iconSvg(192), 192],
  ["public/icon-512.png", iconSvg(512), 512],
  ["public/icon-maskable-192.png", maskableSvg(192), 192],
  ["public/icon-maskable-512.png", maskableSvg(512), 512],
  ["public/apple-icon-180.png", iconSvg(180), 180],
  ["app/apple-icon.png", iconSvg(180), 180],
  ["app/icon.png", iconSvg(512), 512],
];

for (const [out, svg, size] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log("ok:", out);
}
