// POST /api/generate — the heart of Gurke.
// Body: { prompt: string, appId?: string }  (appId = iterate on existing app)
// Returns: { app: {id, name, emoji, url, ...} }

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { generateApp } from "@/lib/generator";
import { getApp, saveApp } from "@/lib/store";
import { generateEmojiIcon } from "@/lib/icons";

export const maxDuration = 120; // generation can take a while

export async function POST(request) {
  try {
    const { prompt, appId } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe the app you want in a sentence or two." },
        { status: 400 }
      );
    }

    // If we're iterating, feed the existing HTML back to the model.
    const existing = appId ? getApp(appId) : null;
    if (appId && !existing) {
      return NextResponse.json({ error: "That app no longer exists." }, { status: 404 });
    }

    const generated = await generateApp(prompt.trim(), existing?.html ?? null);

    const meta = saveApp({
      id: existing?.id,
      name: generated.name,
      emoji: generated.emoji,
      themeColor: generated.themeColor,
      prompt: existing ? `${existing.prompt}\n→ ${prompt.trim()}` : prompt.trim(),
      html: generated.html,
    });

    // Generate per-app emoji icons (non-fatal if it fails)
    try {
      const appsDir = path.join(process.cwd(), "data", "apps");
      for (const size of [192, 512]) {
        const buf = generateEmojiIcon(meta.emoji, meta.themeColor, size);
        fs.writeFileSync(path.join(appsDir, `${meta.id}-icon-${size}.png`), buf);
      }
    } catch (iconErr) {
      console.warn("Icon generation failed (non-fatal):", iconErr.message);
    }

    return NextResponse.json({ app: { ...meta, url: `/a/${meta.id}` } });
  } catch (err) {
    console.error("generate failed:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong while growing your app." },
      { status: 500 }
    );
  }
}
