/* Kota Connect PWA service worker. Caches the app shell only. */
const CACHE_NAME = "kota-connect-shell-v1";
const APP_SHELL = [
  new URL("./", self.registration.scope).href,
  new URL("./index.html", self.registration.scope).href,
  new URL("./manifest.json", self.registration.scope).href,
  new URL("./icon-192.png", self.registration.scope).href,
  new URL("./icon-512.png", self.registration.scope).href
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("kota-connect-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Never intercept Firebase/CDN requests.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then(response => {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); return response;
    }).catch(async () => (await caches.match(req)) || (await caches.match(new URL("./index.html", self.registration.scope).href)) || Response.error()));
    return;
  }
  if (APP_SHELL.includes(req.url)) event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
