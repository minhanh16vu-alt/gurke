// GET /a/<id> — serves a generated app as a real, installable page.
//
// Before sending the stored HTML we inject three small things into <head>:
//   1. a <link rel="manifest"> pointing at /a/<id>/manifest, so browsers
//      treat each generated app as its own installable PWA,
//   2. apple-touch meta tags so iOS "Add to Home Screen" looks right,
//   3. a script registering the shared service worker (/app-sw.js) scoped
//      to /a/, which makes generated apps work offline after first load.

import { getApp } from "@/lib/store";

export async function GET(request, { params }) {
  const app = getApp(params.id);
  if (!app) {
    return new Response("This app doesn't exist (it may have been deleted).", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const inject = `
    <link rel="manifest" href="/a/${app.id}/manifest">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(app.name)}">
    <script>
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/app-sw.js", { scope: "/a/" }).catch(() => {});
      }
    </script>`;

  const html = app.html.includes("</head>")
    ? app.html.replace("</head>", `${inject}\n</head>`)
    : inject + app.html;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
