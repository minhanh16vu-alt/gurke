"use client";

/**
 * GeneratingOverlay — full-screen white overlay shown while an app generates.
 *
 * Shows a centred seedling animation, a status line, the "Bringing your idea
 * to life…" headline, and a SponsorCard. Fades in when visible becomes true
 * and fades out when it becomes false.
 *
 * Props:
 *   visible        bool     — true while generation is in progress
 *   immediate      bool     — skip the fade-out (used when generation errors)
 *   sponsorKey     string   — key into sponsors config; defaults to ACTIVE_SPONSOR
 *   formatOverride string   — overrides the sponsor's default card format
 */

import { useEffect, useState } from "react";
import SponsorCard from "./SponsorCard";
import { sponsors, ACTIVE_SPONSOR } from "@/config/sponsors";

const GROWING_LINES = [
  "Planting the seed…",
  "Sketching the layout…",
  "Growing the interface…",
  "Wiring up the logic…",
  "Watering the service worker…",
  "Almost ripe…",
];

const FADE_MS = 500; // must match the transition duration below

export default function GeneratingOverlay({
  visible,
  immediate = false,
  sponsorKey,
  formatOverride,
}) {
  const [mounted, setMounted]   = useState(false);
  const [shown,   setShown]     = useState(false);
  const [line,    setLine]      = useState(0);
  const reducedMotion           = usePrefersReducedMotion();

  const sponsor =
    sponsors[sponsorKey ?? ACTIVE_SPONSOR] ?? sponsors[ACTIVE_SPONSOR];

  // ── Mount / unmount with fade ──────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Let the browser paint the opacity-0 state first so the transition plays
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setShown(false);
      // On error (immediate=true) or reduced-motion: unmount right away
      const delay = immediate || reducedMotion ? 0 : FADE_MS + 20;
      const t = setTimeout(() => setMounted(false), delay);
      return () => clearTimeout(t);
    }
  }, [visible, immediate, reducedMotion]);

  // ── Cycle status text while generating ────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setLine(0);
    const t = setInterval(
      () => setLine((l) => (l + 1) % GROWING_LINES.length),
      2_200
    );
    return () => clearInterval(t);
  }, [visible]);

  if (!mounted) return null;

  const transition =
    immediate || reducedMotion ? "none" : `opacity ${FADE_MS}ms ease-in-out`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Generating your app"
      className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-7 overflow-y-auto bg-white px-5"
      style={{
        opacity:       shown ? 1 : 0,
        transition,
        pointerEvents: shown ? "auto" : "none",
        // Honour iPhone notch + home-indicator
        paddingTop:    "max(env(safe-area-inset-top, 0px), 1.5rem)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)",
      }}
    >
      {/* ── Seedling + status ── */}
      <div className="flex flex-col items-center gap-2 text-center">
        <SeedlingSvg />

        <p className="mt-1 font-display text-lg font-bold text-ink">
          Bringing your idea to life…
        </p>

        <p
          className="text-sm text-ink/50"
          aria-live="polite"
          aria-atomic="true"
        >
          {GROWING_LINES[line]}
        </p>
      </div>

      {/* ── Sponsor card ── */}
      <div className="w-full max-w-sm">
        <SponsorCard sponsor={sponsor} formatOverride={formatOverride} />
      </div>
    </div>
  );
}

/* ─── Seedling SVG ───────────────────────────────────────────────────────── */
// Reuses the .sprout-stem / .sprout-leaf keyframe animations from globals.css
// (including the existing @media prefers-reduced-motion: reduce { animation: none } rule)

function SeedlingSvg() {
  return (
    <svg
      width="52"
      height="60"
      viewBox="0 0 34 40"
      aria-hidden="true"
    >
      <ellipse cx="17" cy="35" rx="10" ry="4" fill="#E5E5E5" />
      <path
        className="sprout-stem"
        d="M17 35 C17 26 17 20 17 14"
        stroke="#618751"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="sprout-leaf"
        d="M17 18 C11 18 8 13 8 9 C14 9 17 13 17 18 Z"
        fill="#618751"
      />
      <path
        className="sprout-leaf"
        d="M17 14 C23 14 26 9 26 5 C20 5 17 9 17 14 Z"
        fill="#618751"
        style={{ animationDelay: "0.4s" }}
      />
    </svg>
  );
}

/* ─── Utility hook ───────────────────────────────────────────────────────── */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
