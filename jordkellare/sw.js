/* Jordkällaren – service worker: gör sidan installerbar som app.
   Mätvärdena kommer alltid live från Firebase, så bara sidans egna filer sparas. */
const VERSION = 'jordkallare-v19';
const CORE = ['./', './index.html', './firebase-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

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
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // Firebase m.m. går direkt till nätet
  // Egna filer: senaste versionen när det finns nät, annars sparad kopia.
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    try {
      const r = await fetch(req);
      if (r.ok) c.put(req.mode === 'navigate' ? './index.html' : req, r.clone());
      return r;
    } catch (err) {
      return (await c.match(req.mode === 'navigate' ? './index.html' : req)) || Response.error();
    }
  })());
});
