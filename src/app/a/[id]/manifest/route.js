// GET /a/<id>/manifest — a per-app web manifest, generated on the fly.
// This is what makes each generated app installable under its own name.

import { NextResponse } from "next/server";
import { getApp } from "@/lib/store";

export async function GET(request, { params }) {
  const { id } = await params;
  const app = getApp(id);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(
    {
      name: app.name,
      short_name: app.name.slice(0, 12),
      start_url: `/a/${app.id}`,
      scope: `/a/${app.id}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: app.themeColor || "#618751",
      icons: [
        { src: `/a/${app.id}/icon/192`, sizes: "192x192", type: "image/png" },
        { src: `/a/${app.id}/icon/512`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } }
  );
}
