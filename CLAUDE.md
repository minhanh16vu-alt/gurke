# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # Run Next.js linter
npm start            # Start production server
```

To test on a physical device:
```bash
npm run dev -- -H 0.0.0.0   # Expose to phone on same local network
```

**Environment**: Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Optionally set `ANTHROPIC_MODEL` (defaults to `claude-sonnet-4-6`).

## Architecture

Gurke is a Next.js 14 PWA that lets users describe utility apps in plain language; Claude generates self-contained HTML files that are immediately served and installable.

### Core flow

```
User prompt → POST /api/generate → generator.js (Claude API)
  → Parse HTML + <!--GURKE_META {...}--> comment → store.js → data/apps/<id>.html
  → Serve at /a/<id> with injected PWA metadata → Browser caches via service worker
```

### Key files

| Path | Purpose |
|------|---------|
| `src/lib/generator.js` | Claude API call, system prompt, metadata parsing, app iteration |
| `src/lib/store.js` | File-based persistence (`data/apps.json` index + `data/apps/<id>.html`) |
| `src/app/api/generate/route.js` | POST endpoint; 120s timeout |
| `src/app/api/apps/route.js` | GET (list) + DELETE for app management |
| `src/app/a/[id]/route.js` | Serves generated app HTML with injected service worker + PWA tags |
| `src/app/a/[id]/manifest/route.js` | Per-app web manifest |
| `src/components/Chat.jsx` | Creation UI with templates and "Improve:" iteration flow |
| `src/components/Hub.jsx` | App grid with launch/share/delete |
| `public/sw.js` | Gurke shell service worker (network-first) |
| `public/app-sw.js` | Generated apps service worker (cache-first, scope `/a/`) |

### Generated app constraints

Claude is prompted to produce apps that are:
- Single self-contained HTML files (no external dependencies, no CDN links)
- Mobile-first at 390px, 44px+ touch targets
- Using `localStorage` with namespaced keys for persistence
- Supporting dark mode via `prefers-color-scheme`
- Output format: `<!--GURKE_META {"name":"...","emoji":"...","themeColor":"..."}-->` followed by a complete HTML5 document

### Storage

`store.js` exposes 4 functions (`listApps`, `getApp`, `saveApp`, `deleteApp`) over the local filesystem. App IDs are 12-char hex strings validated against `/[a-f0-9]{12}/`. The abstraction is designed to swap to Supabase — the filesystem is ephemeral on Vercel.

### Design tokens (Tailwind)

Cucumber-themed palette: `rind` (#1F4D2E), `sprout` (#7CC24B), `flesh` (#F4F9EE), `brine` (#DCE9D3), `blossom` (#F5C445), `ink` (#17251A). Custom fonts: Bricolage Grotesque (display), Inter (body).
