// Gurke's own service worker: network-first with a cache fallback,
// so the shell still opens when you're offline.
const CACHE = "gurke-shell-v1";

self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Generated apps under /a/ are handled by app-sw.js (cache-first).
  if (new URL(e.request.url).pathname.startsWith("/a/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
