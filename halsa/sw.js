/* Olles Hälsa – service worker: gör appen installerbar och användbar utan nät. */
const VERSION = 'halsa-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // synken (POST till Google) går alltid direkt
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // Google, QR-biblioteket m.m. hämtas från nätet
  // Sidan själv: hämta ny version när det finns nät, annars sparad kopia.
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      try { const r = await fetch(req); if (r.ok) c.put('./index.html', r.clone()); return r; }
      catch (err) { return (await c.match('./index.html')) || (await c.match(req, { ignoreSearch: true })) || Response.error(); }
    })());
    return;
  }
  // Ikoner och manifest: sparad kopia först, annars nätet.
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  })());
});
