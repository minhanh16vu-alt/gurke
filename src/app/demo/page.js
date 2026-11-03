"use client";

/**
 * /demo — screen-recording helper for the generation loading screen.
 *
 * Shows the GeneratingOverlay for SHOW_DURATION ms, fades it out, pauses,
 * then loops — no API calls, no generation logic involved.
 *
 * URL params:
 *   ?sponsor=<key>    — which sponsor to display (default: ACTIVE_SPONSOR)
 *   ?format=<fmt>     — override the sponsor's card format
 *                        "static" | "slideshow" | "video"
 *   ?debug=1          — show a countdown pill (hidden by default for clean recordings)
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import { ACTIVE_SPONSOR } from "@/config/sponsors";

const SHOW_DURATION = 15_000; // ms overlay stays visible
const RESET_PAUSE   =  2_000; // ms after fade-out before next loop

function DemoInner() {
  const params         = useSearchParams();
  const sponsorKey     = params.get("sponsor")  || ACTIVE_SPONSOR;
  const formatOverride = params.get("format")   || undefined;
  const debug          = params.get("debug")    === "1";

  const [visible,   setVisible]   = useState(true);
  const [countdown, setCountdown] = useState(Math.round(SHOW_DURATION / 1_000));

  // ── Loop: show → hide → pause → show ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    function start() {
      setVisible(true);
      setCountdown(Math.round(SHOW_DURATION / 1_000));

      const hideTimer = setTimeout(() => {
        if (cancelled) return;
        setVisible(false);

        const restartTimer = setTimeout(() => {
          if (!cancelled) start();
        }, RESET_PAUSE);

        return () => clearTimeout(restartTimer);
      }, SHOW_DURATION);

      return () => clearTimeout(hideTimer);
    }

    const cleanup = start();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown tick (debug mode only) ──────────────────────────────────
  useEffect(() => {
    if (!debug || !visible) return;
    const t = setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1_000
    );
    return () => clearInterval(t);
  }, [debug, visible]);

  return (
    <>
      <GeneratingOverlay
        visible={visible}
        sponsorKey={sponsorKey}
        formatOverride={formatOverride}
      />

      {/* Debug pill — only shown with ?debug=1 so screen recordings are clean */}
      {debug && (
        <div
          className="fixed right-4 z-50 rounded-full bg-black/80 px-3 py-1.5 font-display text-xs text-white"
          style={{
            bottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)",
          }}
        >
          Recording demo… {countdown}s
        </div>
      )}
    </>
  );
}

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Suspense required because useSearchParams() is a client boundary */}
      <Suspense>
        <DemoInner />
      </Suspense>
    </div>
  );
}
