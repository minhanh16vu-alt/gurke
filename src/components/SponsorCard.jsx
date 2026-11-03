"use client";

/**
 * SponsorCard — rendered inside GeneratingOverlay while an app generates.
 *
 * Props:
 *   sponsor        — one entry from src/config/sponsors.js
 *   formatOverride — optional string to override sponsor.format
 *                    ("static" | "slideshow" | "video")
 */

import { useEffect, useState } from "react";

const SLIDE_DURATION   = 3_500; // ms each slide is shown
const SLIDE_TRANSITION = 500;   // ms for the opacity crossfade

export default function SponsorCard({ sponsor, formatOverride }) {
  const format = formatOverride ?? sponsor.format;
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
      {/* ── Visual area ── */}
      {format === "slideshow" && sponsor.slides?.length > 0 ? (
        <SlideshowVisual slides={sponsor.slides} reducedMotion={reducedMotion} />
      ) : format === "video" && sponsor.video?.src ? (
        <VideoVisual video={sponsor.video} fallbackGradient={sponsor.gradient} />
      ) : (
        <StaticVisual gradient={sponsor.gradient} />
      )}

      {/* ── Info area ── */}
      <div className="px-4 pb-4 pt-3">
        {/* SPONSORED label */}
        <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/35">
          Sponsored
        </p>

        {/* Logo + name */}
        <div className="mb-2 flex items-center gap-2.5">
          <LogoAvatar sponsor={sponsor} />
          <span className="font-display text-sm font-semibold text-ink">
            {sponsor.name}
          </span>
        </div>

        {/* Headline */}
        <p className="mb-1.5 font-display text-base font-bold leading-snug text-ink">
          {sponsor.headline}
        </p>

        {/* Description */}
        {sponsor.description && (
          <p className="mb-3 text-xs leading-relaxed text-ink/55">
            {sponsor.description}
          </p>
        )}

        {/* CTA */}
        {sponsor.cta && (
          <a
            href={sponsor.cta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl py-2.5 text-center font-display text-sm font-bold text-white transition-opacity active:opacity-75"
            style={{ backgroundColor: sponsor.accentColor }}
          >
            {sponsor.cta.text}
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Visual sub-components ─────────────────────────────────────────────── */

function StaticVisual({ gradient }) {
  return (
    <div
      className="h-36 w-full"
      style={{
        background: gradient || "linear-gradient(135deg, #618751 0%, #3d6b3f 100%)",
      }}
    />
  );
}

function SlideshowVisual({ slides, reducedMotion }) {
  const [active, setActive] = useState(0);

  // Auto-advance — paused when user prefers reduced motion
  useEffect(() => {
    if (reducedMotion || slides.length <= 1) return;
    const t = setInterval(
      () => setActive((s) => (s + 1) % slides.length),
      SLIDE_DURATION
    );
    return () => clearInterval(t);
  }, [reducedMotion, slides.length]);

  return (
    <div className="relative h-36 w-full overflow-hidden select-none">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 flex items-end px-4 pb-3"
          style={{
            background: slide.gradient,
            opacity: i === active ? 1 : 0,
            transition: reducedMotion
              ? "none"
              : `opacity ${SLIDE_TRANSITION}ms ease-in-out`,
          }}
        >
          <p className="text-xs font-semibold text-white/90 drop-shadow-sm">
            {slide.caption}
          </p>
        </div>
      ))}

      {/* Dot / pill indicators */}
      <div
        className="absolute bottom-2.5 right-3 flex items-center gap-1"
        role="tablist"
        aria-label="Slides"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full bg-white/70 transition-all"
            style={{
              width: i === active ? "1.25rem" : "0.375rem",
              opacity: i === active ? 1 : 0.55,
              transition: reducedMotion ? "none" : "width 300ms ease, opacity 300ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function VideoVisual({ video, fallbackGradient }) {
  const [error, setError] = useState(false);

  if (error) return <StaticVisual gradient={fallbackGradient} />;

  return (
    <div className="h-36 w-full overflow-hidden bg-black">
      <video
        src={video.src}
        poster={video.poster ?? undefined}
        muted
        loop
        autoPlay
        playsInline
        className="h-full w-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

/* ─── Logo avatar ────────────────────────────────────────────────────────── */

function LogoAvatar({ sponsor }) {
  // Raw SVG supplied → render inline (always static, trusted config data)
  if (sponsor.logoSvg) {
    return (
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center"
        dangerouslySetInnerHTML={{ __html: sponsor.logoSvg }}
      />
    );
  }

  // No logo → letter avatar using the sponsor's accent colour
  const initial = sponsor.name.charAt(0).toUpperCase();
  return (
    <span
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
      style={{ backgroundColor: sponsor.accentColor }}
    >
      {initial}
    </span>
  );
}

/* ─── Utility hook ───────────────────────────────────────────────────────── */

/** Returns true when the OS reports prefers-reduced-motion: reduce. SSR-safe. */
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
