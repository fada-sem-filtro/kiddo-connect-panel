/**
 * Agenda Fleur — Service Worker
 * Versão: 2.6.4
 *
 * Estratégias:
 *  - HTML / navegação        → NetworkFirst (timeout 3s) — nunca trava em build antiga
 *  - JS / CSS estáticos      → StaleWhileRevalidate
 *  - Imagens                 → CacheFirst (limit 60)
 *  - Fontes Google           → CacheFirst (longa duração)
 *  - APIs (Supabase / OAuth) → passthrough (nunca cachear)
 */

const APP_VERSION   = "2.6.4";
const STATIC_CACHE  = `afleur-static-v${APP_VERSION}`;
const RUNTIME_CACHE = `afleur-runtime-v${APP_VERSION}`;
const IMAGE_CACHE   = `afleur-img-v${APP_VERSION}`;
const FONT_CACHE    = `afleur-fonts-v${APP_VERSION}`;
const HTML_CACHE    = `afleur-html-v${APP_VERSION}`;

const VALID_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE, FONT_CACHE, HTML_CACHE]);

const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ───────────── INSTALL ─────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  // Disponibilidade imediata da nova versão
  self.skipWaiting();
});

// ───────────── ACTIVATE ─────────────
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => !VALID_CACHES.has(n)).map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

// ───────────── MESSAGES ─────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0]?.postMessage({ version: APP_VERSION });
  }
});

// ───────────── HELPERS ─────────────
function isApiRequest(url) {
  return (
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/functions/") ||
    url.pathname.startsWith("/storage/") ||
    url.pathname.startsWith("/realtime/") ||
    url.pathname.startsWith("/~oauth") ||
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith(".supabase.in")
  );
}

function isImageRequest(req, url) {
  return req.destination === "image" || /\.(png|jpe?g|gif|webp|svg|avif|ico)$/i.test(url.pathname);
}

function isFontRequest(req, url) {
  return req.destination === "font" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com" ||
    /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname);
}

function isStaticAsset(req, url) {
  return req.destination === "script" || req.destination === "style" ||
    /\.(js|mjs|css)$/i.test(url.pathname) ||
    url.pathname.startsWith("/assets/");
}

function isVersionFile(url) {
  return url.pathname === "/version.json";
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)));
  }
}

async function networkFirst(req, cacheName, timeoutMs = 3000) {
  const cache = await caches.open(cacheName);
  try {
    const network = await Promise.race([
      fetch(req),
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), timeoutMs)),
    ]);
    if (network && network.ok) cache.put(req, network.clone());
    return network;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") {
      const fallback = await cache.match("/");
      if (fallback) return fallback;
    }
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function cacheFirst(req, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) {
    cache.put(req, res.clone());
    if (maxItems) trimCache(cacheName, maxItems);
  }
  return res;
}

// ───────────── FETCH ─────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Nunca cachear APIs / auth / storage
  if (isApiRequest(url)) return;

  // version.json sempre da rede (sem cache)
  if (isVersionFile(url)) {
    event.respondWith(fetch(req, { cache: "no-store" }).catch(() => new Response('{"version":"unknown"}', { headers: { "Content-Type": "application/json" } })));
    return;
  }

  // HTML / navegação → NetworkFirst
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(networkFirst(req, HTML_CACHE, 3000));
    return;
  }

  // Fontes
  if (isFontRequest(req, url)) {
    event.respondWith(cacheFirst(req, FONT_CACHE, 30));
    return;
  }

  // Imagens
  if (isImageRequest(req, url)) {
    event.respondWith(cacheFirst(req, IMAGE_CACHE, 60));
    return;
  }

  // JS / CSS / assets versionados
  if (isStaticAsset(req, url)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // Default: SWR conservador
  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
});
