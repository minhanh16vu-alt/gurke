"use client";

// Step-by-step "Add to Home Screen" instructions.
// Detects the platform to open the right tab, but always lets the user
// switch — people share links across devices all the time.

import { useEffect, useState } from "react";

const STEPS = {
  ios: {
    label: "iPhone / iPad (Safari)",
    steps: [
      { icon: "🧭", text: "Open the link in Safari (installing only works from Safari on iOS)." },
      { icon: "📤", text: "Tap the Share button — the square with an arrow at the bottom of the screen." },
      { icon: "➕", text: "Scroll down and tap “Add to Home Screen”." },
      { icon: "✅", text: "Tap “Add” in the top-right corner. The app now has its own icon, like any other app." },
    ],
  },
  android: {
    label: "Android (Chrome)",
    steps: [
      { icon: "🌐", text: "Open the link in Chrome." },
      { icon: "⋮", text: "Tap the three-dot menu in the top-right corner." },
      { icon: "➕", text: "Tap “Add to Home screen” (sometimes shown as “Install app”)." },
      { icon: "✅", text: "Confirm with “Add” / “Install”. The icon appears on your home screen." },
    ],
  },
};

export default function InstallGuide({ appName }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("ios");

  useEffect(() => {
    if (typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)) {
      setPlatform("android");
    }
  }, []);

  return (
    <div className="rounded-xl border border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold"
        aria-expanded={open}
      >
        📲 Put {appName} on your home screen
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-line px-3 pb-3 pt-2">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 text-xs font-medium">
            {Object.entries(STEPS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setPlatform(key)}
                className={`rounded-md px-2 py-1.5 ${
                  platform === key ? "bg-white shadow-sm" : "text-ink/50"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
          <ol className="space-y-2.5">
            {STEPS[platform].steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs">
                  {s.icon}
                </span>
                <span className="text-ink/80">{s.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-xs text-ink/70">
            💡 After the first visit, {appName} works offline too — your data is
            saved on your device.
          </p>
        </div>
      )}
    </div>
  );
}
