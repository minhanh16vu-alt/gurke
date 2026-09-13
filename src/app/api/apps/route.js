// GET    /api/apps        — list all apps in the hub
// DELETE /api/apps?id=xyz — remove an app

import { NextResponse } from "next/server";
import { listApps, deleteApp } from "@/lib/store";

export async function GET() {
  const apps = listApps().map((a) => ({ ...a, url: `/a/${a.id}` }));
  return NextResponse.json({ apps });
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !deleteApp(id)) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
