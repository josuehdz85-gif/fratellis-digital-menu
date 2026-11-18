// One-off: builds app icons from the logo and converts the large source photos.
// Run: node scripts/prepare-images.mjs "<folder with the original PNG photos>"
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const src = process.argv[2];
mkdirSync("public/icons", { recursive: true });

const logo = "public/img/logo.png";
const bg = { r: 255, g: 255, b: 255, alpha: 1 };
async function icon(size, file, pad) {
  const inner = Math.round(size * (1 - pad * 2));
  const img = await sharp(logo).resize(inner, inner, { fit: "contain", background: bg }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: img, gravity: "center" }])
    .png()
    .toFile(file);
}
await icon(192, "public/icons/icon-192.png", 0.06);
await icon(512, "public/icons/icon-512.png", 0.06);
await icon(512, "public/icons/icon-maskable-512.png", 0.18);
await icon(180, "public/icons/apple-touch-icon.png", 0.08);
console.log("icons ok");

if (src) {
  const map = { "antipasto.png": "antipasto.jpg", "ChefSalad.png": "chef-salad.jpg", "chocolate-mousse-cake.png": "chocolate-mousse.jpg" };
  for (const [from, to] of Object.entries(map)) {
    const f = path.join(src, from);
    if (!existsSync(f)) continue;
    await sharp(f).rotate().resize(1100, 1100, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join("public/img", to));
    console.log("photo", to);
  }
}
