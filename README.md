# 🥒 Gurke — grow your own apps

Gurke is an AI-powered PWA generator and personal app hub. Describe a small
utility app in plain words ("a Pomodoro timer with streaks"), and Gurke uses
Claude to build it, hosts it instantly at its own URL, and walks you through
adding it to your phone's home screen. All your apps live in a personal hub.

Gurke itself is a PWA too — install it and it feels like a native app.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your Anthropic API key
npm run dev
```

Open http://localhost:3000. To test on your phone during development, run
`npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000` from a
phone on the same Wi-Fi. (Note: service workers and "Add to Home Screen"
require HTTPS or localhost, so full install testing works best on a deployed
version — see below.)

You need an Anthropic API key from https://console.anthropic.com. The model
defaults to `claude-sonnet-4-6` and can be changed via `ANTHROPIC_MODEL` in
`.env.local`.

## How it works

```
 User idea ──> POST /api/generate ──> Claude API
                                        │  returns one self-contained
                                        │  HTML file + metadata comment
                                        ▼
                              data/apps/<id>.html  (file store)
                                        │
 Phone browser <── GET /a/<id> ─────────┘
        │            (HTML served with an injected per-app manifest
        │             link + service worker registration)
        ▼
 "Add to Home Screen" → installable, offline-capable mini-app
```

Key design decisions for the prototype:

- **Generated apps are single self-contained HTML files.** No build step, no
  external requests, data saved in `localStorage`. This makes generation
  reliable, apps fast, and offline support trivial.
- **"Deploy" = save + serve.** Instead of integrating the Vercel API in v1,
  generated apps are served by Gurke itself at `/a/<id>`. The moment
  generation finishes, the link is live and shareable. When you deploy Gurke
  (e.g. to Vercel), every generated app is automatically on the public
  internet with HTTPS — which is exactly what "Add to Home Screen" needs.
- **Each generated app is its own PWA.** The serving route injects a
  `<link rel="manifest">` pointing at a manifest generated on the fly
  (`/a/<id>/manifest`), so each app installs under its own name and theme
  color. A shared cache-first service worker (`/public/app-sw.js`, scope
  `/a/`) makes apps work offline after the first visit.
- **Storage is swappable.** All persistence goes through `src/lib/store.js`
  (list/get/save/delete). It's a JSON index + HTML files on disk for now;
  replace the internals with Supabase and nothing else changes.

## Project structure

```
src/
  app/
    page.js                 Main UI: Create (chat) + My apps (hub) tabs
    layout.js               Fonts, PWA metadata, service worker registration
    globals.css             Tailwind + the sprout animation
    api/generate/route.js   Idea -> Claude -> saved app
    api/apps/route.js       List / delete apps
    a/[id]/route.js         Serves a generated app (manifest + SW injected)
    a/[id]/manifest/route.js  Per-app web manifest
  components/
    Chat.jsx                Chat, templates, loading state, result cards
    Hub.jsx                 App grid with launch / share / delete
    InstallGuide.jsx        iOS + Android home-screen instructions
  lib/
    generator.js            Claude API call + system prompt + parsing
    store.js                File-based persistence (swap for Supabase later)
public/
  manifest.json, sw.js      Gurke's own PWA shell
  app-sw.js                 Shared offline worker for generated apps
  icons/                    App icons (also reused by generated apps in v1)
```

## Deploying Gurke

Push to GitHub and import into Vercel (zero config for Next.js).

⚠️ **Important:** the file-based store lives on an ephemeral filesystem on
Vercel, so generated apps will disappear between deployments/cold starts.
For a persistent deployment, swap `src/lib/store.js` to Supabase:
a `apps` table (id, name, emoji, theme_color, prompt, html, timestamps) maps
1:1 onto the store's four functions. Everything else keeps working.

Also set `ANTHROPIC_API_KEY` in the Vercel project's environment variables.

## Iterating on apps

After generating at least one app, an "Improve:" row appears above the
composer. Pick an app, describe the change ("add sound notifications"), and
Gurke feeds the current HTML back to Claude and re-plants the updated
version at the same URL — user data survives because the localStorage key is
preserved.

## Roadmap ideas (post-MVP)

- Supabase persistence + simple accounts (each user sees only their hub)
- Per-app icons (render the app's emoji to a PNG at generation time)
- Real multi-file generation for bigger apps, with a Vercel API deploy path
- Screenshots in the install guide, and `beforeinstallprompt` on Android
- Rate limiting / auth on `/api/generate` before exposing it publicly
- Capacitor wrapper for true native builds
