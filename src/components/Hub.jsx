"use client";

// Hub — "My apps": a grid of everything the user has grown,
// with launch, share, and delete.

import { useState } from "react";

export default function Hub({ apps, onChanged, onCreate }) {
  if (!apps?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="text-5xl">🧺</span>
        <h2 className="font-display text-xl font-bold">Your basket is empty</h2>
        <p className="text-sm text-ink/60">
          Apps you grow will show up here, ready to launch or install.
        </p>
        <button
          onClick={onCreate}
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Grow your first app
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-5">
      <h2 className="font-display text-2xl font-bold">My apps</h2>
      <p className="mb-4 text-sm text-ink/60">Tap to launch — or share a link with anyone.</p>
      <div className="grid grid-cols-2 gap-3">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function AppCard({ app, onChanged }) {
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    await fetch(`/api/apps?id=${app.id}`, { method: "DELETE" });
    onChanged?.();
  }

  async function share() {
    const url = `${window.location.origin}${app.url}`;
    if (navigator.share) {
      try { await navigator.share({ title: app.name, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-blob border border-line bg-white shadow-sm">
      <a href={app.url} target="_blank" rel="noreferrer" className="flex flex-1 flex-col items-center gap-1 px-3 pb-2 pt-4 active:bg-surface">
        <span className="text-4xl">{app.emoji}</span>
        <p className="text-center font-display text-sm font-bold leading-tight">{app.name}</p>
        <p className="text-[11px] text-ink/40">
          {new Date(app.updatedAt).toLocaleDateString()}
        </p>
      </a>
      <div className="grid grid-cols-2 border-t border-line text-xs font-medium">
        <button onClick={share} className="py-2 active:bg-surface">Share</button>
        {confirming ? (
          <button onClick={remove} className="bg-red-50 py-2 font-semibold text-red-700">
            Sure?
          </button>
        ) : (
          <button onClick={() => setConfirming(true)} className="border-l border-line py-2 text-ink/50 active:bg-surface">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
