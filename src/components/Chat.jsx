"use client";

// Chat — the main way to talk to Gurke.
// Flow: pick a template or type an idea → POST /api/generate → show a
// result card with the live link, install instructions, and iteration hints.
// When `selectedApp` is set, Chat loads that app's persisted message history
// and uses it as the edit target (the sidebar drives app selection).

import { useEffect, useRef, useState } from "react";
import InstallGuide from "./InstallGuide";
import { compressImage } from "@/lib/compressImage";

const TEMPLATES = [
  { emoji: "🍅", label: "Pomodoro timer", prompt: "A Pomodoro timer with 25/5 minute cycles, a session counter, and a daily streak." },
  { emoji: "✅", label: "Todo list", prompt: "A simple todo list with checkboxes, swipe-free delete buttons, and completed items moving to the bottom." },
  { emoji: "💶", label: "Expense tracker", prompt: "An expense tracker for freelancers: add expenses with amount, category, and note; show monthly totals per category." },
  { emoji: "🔁", label: "Habit tracker", prompt: "A habit tracker where I can add habits and tap them once per day; show current streaks and a 7-day history grid." },
  { emoji: "🧮", label: "Tip calculator", prompt: "A tip calculator: enter the bill, pick a tip percentage, split between people, show per-person total." },
];

const GROWING_LINES = [
  "Planting the seed…",
  "Sketching the layout…",
  "Growing the interface…",
  "Wiring up the logic…",
  "Watering the service worker…",
  "Almost ripe…",
];

export default function Chat({ selectedApp, onAppSaved, onNew }) {
  const [messages, setMessages] = useState([]); // {role, text?, app?, error?}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // app being iterated on
  const [referenceImage, setReferenceImage] = useState(null); // base64 data URL or null
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // When the sidebar selection changes, load that app's message history.
  useEffect(() => {
    if (!selectedApp) {
      setMessages([]);
      setEditTarget(null);
      return;
    }
    setEditTarget(selectedApp);
    fetch(`/api/apps/${selectedApp.id}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]));
  }, [selectedApp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function persistMessages(appId, msgs) {
    try {
      await fetch(`/api/apps/${appId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch {
      // non-fatal — in-memory state is still correct
    }
  }

  async function handleImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 20 * 1024 * 1024) { alert("Please pick an image under 20 MB."); return; }
    try { setReferenceImage(await compressImage(file)); }
    catch (err) { console.warn("Image compression failed:", err.message); }
  }

  async function send(promptText) {
    const prompt = (promptText ?? input).trim();
    if (!prompt || busy) return;

    const imageToSend = referenceImage;
    const newUser = { role: "user", text: prompt, ...(imageToSend ? { referenceImage: imageToSend } : {}) };
    const withUser = [...messages, newUser];
    setMessages(withUser);
    setInput("");
    setReferenceImage(null);
    setBusy(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, appId: editTarget?.id ?? null, ...(imageToSend ? { referenceImage: imageToSend } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");

      const newAsst = { role: "assistant", app: data.app, updated: !!editTarget, ...(imageToSend ? { referenceImage: imageToSend } : {}) };
      const withResult = [...withUser, newAsst];
      setMessages(withResult);
      setEditTarget(null);
      await persistMessages(data.app.id, withResult);
      onAppSaved?.();
    } catch (err) {
      const withError = [
        ...withUser,
        { role: "assistant", error: err.message, retryPrompt: prompt },
      ];
      setMessages(withError);
      // Persist error state if we have an app to attach it to
      if (editTarget?.id) persistMessages(editTarget.id, withError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col px-4 pb-4 pt-5">
      {/* Welcome + templates (only before the first message) */}
      {messages.length === 0 && !editTarget && (
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold leading-tight">
            What do you want
            <br />
            to grow today?
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Describe a small app in plain words. Gurke builds it, gives you a
            link, and shows you how to put it on your home screen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => send(t.prompt)}
                className="rounded-full border border-line bg-white px-3 py-2 text-sm font-medium shadow-sm transition-transform active:scale-95"
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="ml-10 self-end flex flex-col items-end gap-1.5">
              {msg.referenceImage && (
                <img src={msg.referenceImage} alt="Reference image"
                  className="h-24 w-24 rounded-xl object-cover border border-white/30 shadow-sm" />
              )}
              <div className="rounded-blob rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">
                {msg.text}
              </div>
            </div>
          ) : msg.error ? (
            <div key={i} className="mr-6 self-start rounded-blob rounded-bl-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
              <p className="font-medium text-red-800">That one didn&apos;t take root.</p>
              <p className="mt-1 text-red-700">{msg.error}</p>
              <button
                onClick={() => send(msg.retryPrompt)}
                className="mt-2 rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : (
            <AppResultCard key={i} app={msg.app} updated={msg.updated} referenceImage={msg.referenceImage} />
          )
        )}

        {busy && <SproutingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Iteration banner */}
      {editTarget && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs">
          <span>
            Editing <strong>{editTarget.emoji} {editTarget.name}</strong> — describe the change
          </span>
          <button onClick={onNew} className="font-semibold text-accent">
            Cancel
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="sticky bottom-0 mt-3 bg-white pt-1">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { handleImageFile(e.target.files?.[0]); e.target.value = ""; }} />
        {referenceImage && (
          <div className="mb-2 flex items-center gap-2">
            <div className="relative">
              <img src={referenceImage} alt="Reference" className="h-14 w-14 rounded-xl object-cover border border-line shadow-sm" />
              <button onClick={() => setReferenceImage(null)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white text-[10px]"
                aria-label="Remove reference image">✕</button>
            </div>
            <p className="text-xs text-ink/50">Aesthetic reference attached</p>
          </div>
        )}
        <div className="flex items-end gap-2">
        <button onClick={() => fileInputRef.current?.click()} disabled={busy}
          className="flex-shrink-0 rounded-full border border-line bg-white p-3 text-ink/50 shadow-sm transition-transform active:scale-95 disabled:opacity-40"
          aria-label="Attach reference image">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={editTarget ? "e.g. add sound notifications" : "e.g. a water-intake tracker with a daily goal"}
          className="max-h-32 flex-1 resize-none rounded-blob border border-line bg-white px-4 py-3 text-sm outline-none focus:border-accent"
          disabled={busy}
        />
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          className="rounded-full bg-accent p-3 text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
          aria-label="Send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        </div>
      </div>
    </div>
  );
}

/** The result card: link, launch, install guide, add-to-hub confirmation. */
function AppResultCard({ app, updated, referenceImage }) {
  return (
    <div className="mr-4 self-start overflow-hidden rounded-blob rounded-bl-md border border-line bg-white shadow-sm">
      {referenceImage && (
        <div className="relative h-20 w-full overflow-hidden bg-surface">
          <img src={referenceImage} alt="Aesthetic reference" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 flex items-end px-3 pb-1.5">
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/90">aesthetic ref</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <span className="text-2xl">{app.emoji}</span>
        <div>
          <p className="font-display font-bold leading-tight">{app.name}</p>
          <p className="text-xs text-ink/50">
            {updated ? "Updated and re-planted 🌿" : "Freshly grown and added to My apps"}
          </p>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Open {app.name} ↗
        </a>
        <p className="break-all rounded-lg bg-surface px-3 py-2 font-mono text-xs text-ink/60">
          {typeof window !== "undefined" ? window.location.origin : ""}{app.url}
        </p>
        <InstallGuide appName={app.name} />
      </div>
    </div>
  );
}

/** Signature loading state: a seedling sprouts while Claude writes the app. */
function SproutingBubble() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % GROWING_LINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mr-10 flex items-center gap-3 self-start rounded-blob rounded-bl-md border border-line bg-white px-4 py-3">
      <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true">
        <ellipse cx="17" cy="35" rx="10" ry="4" fill="#E5E5E5" />
        <path className="sprout-stem" d="M17 35 C17 26 17 20 17 14" stroke="#618751" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path className="sprout-leaf" d="M17 18 C11 18 8 13 8 9 C14 9 17 13 17 18 Z" fill="#618751" />
        <path className="sprout-leaf" d="M17 14 C23 14 26 9 26 5 C20 5 17 9 17 14 Z" fill="#618751" style={{ animationDelay: "0.4s" }} />
      </svg>
      <p className="text-sm text-ink/60" aria-live="polite">{GROWING_LINES[line]}</p>
    </div>
  );
}
