// Shared service worker for GENERATED apps (scope: /a/).
// Cache-first: after the first visit, a generated app opens instantly
// and keeps working with no connection — timers, trackers, lists, etc.
// (Generated apps are fully self-contained, so caching the page is enough.)
const CACHE = "gurke-apps-v1";

self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      // Serve from cache immediately, refresh in the background.
      return cached || network;
    })
  );
});
