/* Olles Hälsa – service worker: gör appen installerbar, användbar utan nät och uppdaterar den automatiskt. */
const VERSION = 'halsa-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
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
  if (url.searchParams.has('check')) return;              // versionskollen går alltid direkt till nätet
  // Sidan själv: alltid senaste versionen när det finns nät (förbi alla cachar), annars sparad kopia.
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      try {
        const fresh = url.origin + url.pathname + (url.search ? url.search + '&' : '?') + '_=' + Date.now();
        const r = await fetch(fresh, { cache: 'no-store', credentials: 'same-origin' });
        if (r.redirected) return fetch(req);
        if (r.ok) { c.put('./index.html', r.clone()); return r; }
        return (await c.match('./index.html')) || r;
      } catch (err) {
        return (await c.match('./index.html')) || (await c.match(req, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }
  // Ikoner och manifest: sparad kopia direkt, men hämta ny i bakgrunden så att ändringar kommer med.
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});
