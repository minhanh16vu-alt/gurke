/**
 * Sponsor configuration for the app-generation loading screen.
 *
 * To switch the active sponsor, change ACTIVE_SPONSOR to any key in `sponsors`.
 * SponsorCard reads this at runtime — no other code needs touching.
 *
 * Sponsor shape:
 *   name          string   Display name
 *   logoSvg       string|null  Raw SVG markup; null → letter-avatar is generated
 *   headline      string   Bold one-liner
 *   description   string   2-3 sentence body copy (optional)
 *   accentColor   string   Hex used for CTA button and letter-avatar bg
 *   format        "static" | "slideshow" | "video"
 *   gradient      string   CSS gradient — used by static format and video fallback
 *   slides        Array    [{gradient, caption}] — slideshow only (3 items ideal)
 *   video         {src, poster} | null — video format; falls back to gradient if missing
 *   cta           {text, url} | null — omit to hide the button
 */

export const ACTIVE_SPONSOR = "placeholder";

export const sponsors = {
  /**
   * Placeholder AI — clearly fictional default.
   * Slideshow format with CSS-gradient-only visuals; no real assets required.
   */
  placeholder: {
    name: "Placeholder AI",
    logoSvg: null,
    headline: "The AI that handles the boring parts",
    description:
      "Stop context-switching. Placeholder AI drafts, organises, and follows up — so you ship faster.",
    accentColor: "#618751",
    format: "slideshow",
    gradient: "linear-gradient(135deg, #618751 0%, #3d6b3f 100%)",
    slides: [
      {
        gradient: "linear-gradient(135deg, #618751 0%, #3d6b3f 100%)",
        caption: "Zero setup. Works in your browser.",
      },
      {
        gradient: "linear-gradient(135deg, #4a8a60 0%, #2d5a3a 100%)",
        caption: "Remembers context across every project.",
      },
      {
        gradient: "linear-gradient(135deg, #1F4D2E 0%, #618751 100%)",
        caption: "Free to start. No credit card.",
      },
    ],
    video: null,
    cta: { text: "Try free →", url: "https://example.com" },
  },

  /**
   * Brickyard Studio — second clearly fictional sponsor.
   * Static format with a warm-orange gradient.
   */
  brickyard: {
    name: "Brickyard Studio",
    logoSvg: null,
    headline: "Design tools built for builders",
    description:
      "From rough wireframe to production-ready component in minutes. Plays nicely with any stack.",
    accentColor: "#C2410C",
    format: "static",
    gradient: "linear-gradient(135deg, #EA580C 0%, #7C2D12 100%)",
    slides: [],
    video: null,
    cta: { text: "Start building →", url: "https://example.com" },
  },
};
