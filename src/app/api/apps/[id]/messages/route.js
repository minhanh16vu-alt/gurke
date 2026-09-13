// GET  /api/apps/[id]/messages  — load persisted chat history for an app
// POST /api/apps/[id]/messages  — overwrite chat history for an app

import { NextResponse } from "next/server";
import { getMessages, saveMessages } from "@/lib/store";

export async function GET(request, { params }) {
  const { id } = await params;
  return NextResponse.json({ messages: getMessages(id) });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { messages } = await request.json();
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array." }, { status: 400 });
  }
  saveMessages(id, messages);
  return NextResponse.json({ ok: true });
}
