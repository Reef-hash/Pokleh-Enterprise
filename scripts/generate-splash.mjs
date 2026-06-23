/**
 * Apple Splash Screen Generator
 *
 * Generates apple-touch-startup-image PNGs for all iOS device sizes.
 * Requires: sharp (npm install sharp --save-dev)
 *
 * Usage: node scripts/generate-splash.mjs
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");

const SPLASHES = [
  // iPad Pro 12.9" (2048x2732)
  { file: "apple-splash-2048.png", w: 2048, h: 2732 },
  // iPad Pro 11" (1668x2388) — using 1668x2224 standard instead
  { file: "apple-splash-1668.png", w: 1668, h: 2224 },
  // iPad 10.5" / Air (1668x2224) handled by 1668
  // iPad 9.7" (1536x2048)
  { file: "apple-splash-1536.png", w: 1536, h: 2048 },
  // iPhone 14 Pro Max (1290x2796)
  { file: "apple-splash-1290.png", w: 1290, h: 2796 },
  // iPhone 11 Pro Max / XS Max (1242x2688)
  { file: "apple-splash-1242.png", w: 1242, h: 2688 },
  // iPhone 14 / 13 / 12 (1170x2532)
  { file: "apple-splash-1170.png", w: 1170, h: 2532 },
  // iPhone X / XS (1125x2436)
  { file: "apple-splash-1125.png", w: 1125, h: 2436 },
  // iPhone 8 Plus / 7 Plus (1242x2208) — using 1080x1920
  // iPhone 8 / 7 / 6s (750x1334) — using 1242x2208 for plus variant
  { file: "apple-splash-828.png", w: 828, h: 1792 },
  // iPhone 8 / 7 / 6s (750x1334)
  { file: "apple-splash-750.png", w: 750, h: 1334 },
  // iPhone SE / 5s (640x1136)
  { file: "apple-splash-640.png", w: 640, h: 1136 },
];

const SOURCE = join(OUT, "icon-512.png");

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`❌ Source icon not found: ${SOURCE}`);
    console.error("Create a 512x512 PNG at that path first.");
    process.exit(1);
  }

  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  for (const s of SPLASHES) {
    const dest = join(OUT, s.file);
    if (existsSync(dest)) {
      console.log(`⏭  Skip ${s.file} (exists)`);
      continue;
    }

    const iconSize = Math.round(Math.min(s.w, s.h) * 0.32); // 32% of smaller dimension

    // Create a solid background and composite the icon
    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 3,
        background: { r: 30, g: 64, b: 175 }, // match theme-color #1e40af
      },
    })
      .composite([
        {
          input: await sharp(SOURCE)
            .resize(iconSize, iconSize)
            .flatten({ background: "#1e40af" })
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(dest);

    console.log(`✅ Generated ${s.file} (${s.w}x${s.h})`);
  }

  console.log("\n🎉 All splash screens generated!");
}

main().catch(console.error);
