const CACHE = "zmanim-v6";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./cities.json", "./icon.svg", "./icon-180.png", "./icon-512.png", "./icon-512-maskable.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// network-first so updates land, cache fallback so it works offline.
// Same-origin only: Sefaria texts go straight to the network and are never
// written into the app cache (no unbounded growth, no study-history record).
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      // only a good response may replace what is cached — a 404 during a deploy
      // window must not evict the working copy
      if (r.ok && r.type === "basic") {
        const copy = r.clone();
        e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}));
      }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(m =>
      m || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
