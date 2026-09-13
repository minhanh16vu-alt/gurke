// icons.js — render an app's emoji to a PNG icon at a given size.
// Uses the `canvas` package which draws via system fonts, giving reliable
// colour-emoji output on macOS and Linux.

import { createCanvas } from "canvas";

/**
 * Render `emoji` centred on a rounded square filled with `themeColor`.
 * @param {string} emoji
 * @param {string} themeColor  hex colour, e.g. "#618751"
 * @param {number} size        192 or 512
 * @returns {Buffer}  PNG buffer
 */
export function generateEmojiIcon(emoji, themeColor, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Rounded background
  const r = size * 0.15;
  ctx.fillStyle = themeColor || "#618751";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Emoji centred
  ctx.font = `${Math.round(size * 0.55)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji || "🌱", size / 2, size / 2 + size * 0.03);

  return canvas.toBuffer("image/png");
}
