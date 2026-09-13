// scripts/gen-icons.js — regenerate Gurke PWA icons with the new logo.
// Run: node scripts/gen-icons.js

import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ACCENT = "#618751";

function drawLogo(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 36; // scale factor (design is 36×36)

  // Background circle
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.lineCap = "round";

  // Stem: M18 27 L18 15 scaled
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(18 * s, 27 * s);
  ctx.lineTo(18 * s, 15 * s);
  ctx.stroke();

  // Right leaf: M18 16 C18 10 25 8 25 13 C25 17 18 16 18 16 Z
  ctx.beginPath();
  ctx.moveTo(18 * s, 16 * s);
  ctx.bezierCurveTo(18 * s, 10 * s, 25 * s, 8 * s, 25 * s, 13 * s);
  ctx.bezierCurveTo(25 * s, 17 * s, 18 * s, 16 * s, 18 * s, 16 * s);
  ctx.closePath();
  ctx.fill();

  // Left leaf (with opacity): M18 19 C18 13 11 11 11 16 C11 20 18 19 18 19 Z
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(18 * s, 19 * s);
  ctx.bezierCurveTo(18 * s, 13 * s, 11 * s, 11 * s, 11 * s, 16 * s);
  ctx.bezierCurveTo(11 * s, 20 * s, 18 * s, 19 * s, 18 * s, 19 * s);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  return canvas.toBuffer("image/png");
}

for (const size of [192, 512]) {
  const buf = drawLogo(size);
  const dest = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(dest, buf);
  console.log(`Wrote ${dest}`);
}
