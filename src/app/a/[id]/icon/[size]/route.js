// GET /a/<id>/icon/<size> — serves the per-app emoji PNG icon.
// Icons are generated when the app is first created/updated and stored at
// data/apps/<id>-icon-<size>.png.

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const VALID_SIZES = new Set(["192", "512"]);
const APPS_DIR = path.join(process.cwd(), "data", "apps");

export async function GET(request, { params }) {
  const { id, size } = await params;

  if (!VALID_SIZES.has(size) || !/^[a-f0-9]{12}$/.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = path.join(APPS_DIR, `${id}-icon-${size}.png`);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });
  }

  const buf = fs.readFileSync(file);
  return new Response(buf, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
