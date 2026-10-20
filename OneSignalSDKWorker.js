importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ===== Stateline offline cache (PWA) =====
const SL_CACHE = "sl-offline-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SL_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(SL_CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((m) => m || caches.match("/"))));
  }
});
