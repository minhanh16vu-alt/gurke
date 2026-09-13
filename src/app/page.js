"use client";

// The whole prototype UI lives in one page with two tabs, styled like a
// native mobile app: sticky header, scrolling content, bottom tab bar.
// A collapsible sidebar (always visible on md+) lists all apps and handles
// navigation between them.

import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import Hub from "@/components/Hub";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [tab, setTab] = useState("create"); // "create" | "hub"
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null); // null = new app
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile toggle
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // The server's app store is the source of truth for the hub.
  async function refreshApps() {
    try {
      const res = await fetch("/api/apps");
      const data = await res.json();
      setApps(data.apps || []);
    } catch {
      /* offline is fine — the hub just shows what it last had */
    }
  }

  useEffect(() => {
    refreshApps();
  }, []);

  function selectApp(app) {
    setSelectedApp(app);
    setTab("create");
    setSidebarOpen(false);
  }

  function startNew() {
    setSelectedApp(null);
    setTab("create");
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-dvh">
      <Splash done={splashDone} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        apps={apps}
        selectedApp={selectedApp}
        onSelect={selectApp}
        onNew={startNew}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 bg-white border-b border-line px-5 pb-4 pt-5 text-ink">
          {/* Hamburger — mobile only */}
          <button
            className="mr-1 rounded-lg p-1 text-ink/50 transition-colors hover:text-ink md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <GurkeLogoMark />
          <h1 className="font-display text-2xl font-bold leading-none tracking-tight">
            Gurke
          </h1>
        </header>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          {tab === "create" ? (
            <Chat
              selectedApp={selectedApp}
              onAppSaved={refreshApps}
              onNew={startNew}
            />
          ) : (
            <Hub
              apps={apps}
              onChanged={refreshApps}
              onCreate={startNew}
            />
          )}
        </main>

        {/* Bottom tab bar */}
        <nav
          className="grid grid-cols-2 border-t border-line bg-white"
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <TabButton active={tab === "create"} onClick={() => setTab("create")} label="Create">
            ✏️
          </TabButton>
          <TabButton active={tab === "hub"} onClick={() => setTab("hub")} label={`My apps${apps.length ? ` (${apps.length})` : ""}`}>
            🧺
          </TabButton>
        </nav>
      </div>
    </div>
  );
}

function Splash({ done }) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-accent
        transition-opacity duration-500 ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <GurkeLogoMark size={80} color="white" />
      <p className="font-display text-3xl font-bold text-white tracking-tight">Gurke</p>
      <p className="text-sm text-white/70">grow your own apps</p>
    </div>
  );
}

function TabButton({ active, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
        active ? "text-accent" : "text-ink/40"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="text-lg leading-none">{children}</span>
      {label}
      <span
        className={`mt-0.5 h-1 w-8 rounded-full transition-colors ${
          active ? "bg-accent" : "bg-transparent"
        }`}
      />
    </button>
  );
}

/** Circle logo mark: green circle with white stem + leaf. */
function GurkeLogoMark({ size = 36, color = "#618751" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="17" fill={color === "white" ? "#618751" : color} />
      <path d="M18 27 L18 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M18 16 C18 10 25 8 25 13 C25 17 18 16 18 16 Z" fill="white" />
      <path d="M18 19 C18 13 11 11 11 16 C11 20 18 19 18 19 Z" fill="white" opacity="0.65" />
    </svg>
  );
}
