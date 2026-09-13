// ---------------------------------------------------------------------------
// store.js — persistence layer for generated apps.
//
// For the prototype this is a simple file-based store:
//   data/apps.json        -> metadata index (id, name, emoji, prompt, dates)
//   data/apps/<id>.html   -> the generated single-file app
//
// It is deliberately wrapped in a tiny API (listApps, getApp, saveApp,
// deleteApp) so you can later swap the internals for Supabase/Postgres
// without touching any route or component.
//
// NOTE: on serverless hosts (Vercel), the filesystem is ephemeral — fine for
// local dev and demos, but move to Supabase before a real deployment.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const APPS_DIR = path.join(DATA_DIR, "apps");
const INDEX_FILE = path.join(DATA_DIR, "apps.json");

function ensureDirs() {
  fs.mkdirSync(APPS_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, "[]", "utf8");
  }
}

function readIndex() {
  ensureDirs();
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  } catch {
    return []; // corrupted index shouldn't crash the app
  }
}

function writeIndex(index) {
  ensureDirs();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), "utf8");
}

/** Message history for one app (newest first is done by caller). */
export function getMessages(id) {
  if (!/^[a-f0-9]{12}$/.test(id)) return [];
  const file = path.join(APPS_DIR, `${id}-messages.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

/** Persist the full message thread for one app. */
export function saveMessages(id, messages) {
  if (!/^[a-f0-9]{12}$/.test(id)) return;
  ensureDirs();
  fs.writeFileSync(
    path.join(APPS_DIR, `${id}-messages.json`),
    JSON.stringify(messages, null, 2),
    "utf8"
  );
}

/** All app metadata, newest first. */
export function listApps() {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Metadata + HTML for one app, or null if it doesn't exist. */
export function getApp(id) {
  // Guard against path tricks like "../" — ids are always hex.
  if (!/^[a-f0-9]{12}$/.test(id)) return null;
  const meta = readIndex().find((a) => a.id === id);
  if (!meta) return null;
  const file = path.join(APPS_DIR, `${id}.html`);
  if (!fs.existsSync(file)) return null;
  return { ...meta, html: fs.readFileSync(file, "utf8") };
}

/**
 * Create a new app (no id given) or update an existing one (id given).
 * Returns the stored metadata.
 */
export function saveApp({ id, name, emoji, themeColor, prompt, html }) {
  ensureDirs();
  const index = readIndex();
  const now = Date.now();

  let meta = id ? index.find((a) => a.id === id) : null;
  if (!meta) {
    meta = { id: crypto.randomBytes(6).toString("hex"), createdAt: now };
    index.push(meta);
  }

  Object.assign(meta, {
    name: name || meta.name || "Untitled app",
    emoji: emoji || meta.emoji || "🌱",
    themeColor: themeColor || meta.themeColor || "#618751",
    prompt: prompt || meta.prompt || "",
    updatedAt: now,
  });

  fs.writeFileSync(path.join(APPS_DIR, `${meta.id}.html`), html, "utf8");
  writeIndex(index);
  return meta;
}

/** Remove an app and its HTML file. Returns true if something was deleted. */
export function deleteApp(id) {
  const index = readIndex();
  const next = index.filter((a) => a.id !== id);
  if (next.length === index.length) return false;
  writeIndex(next);
  if (/^[a-f0-9]{12}$/.test(id)) {
    for (const suffix of [".html", "-messages.json", "-icon-192.png", "-icon-512.png"]) {
      const f = path.join(APPS_DIR, `${id}${suffix}`);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
  return true;
}
