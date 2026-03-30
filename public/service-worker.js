const CACHE_NAME = "agenda-fleur-v1";

const urlsToCache = [
  "/",
  "/conheca",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Never cache OAuth or API requests
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/~oauth") || url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
