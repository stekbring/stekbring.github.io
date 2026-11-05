/* Snaparkiv – service worker: gör appen installerbar, användbar utan nät och uppdaterar den automatiskt.
   Den rör aldrig dina Snapchat-filer – de läses direkt från datorn i sidan och skickas aldrig någonstans. */
const VERSION = 'snaparkiv-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/logo.svg'];
const LIBS = /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\//;

self.addEventListener('install', e => {
  e.waitUntil((async () => { const c = await caches.open(VERSION); await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))); self.skipWaiting(); })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k); await self.clients.claim(); })());
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (LIBS.test(req.url)) { // kartbiblioteket: spara en kopia så kartan kan starta utan nät
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) {
    // sidan själv: senaste versionen när det finns nät, annars sparad kopia
    e.respondWith((async () => { const c = await caches.open(VERSION);
      try { const r = await fetch(new Request('./index.html', { cache: 'no-store' })); if (r.ok) c.put('./index.html', r.clone()); return r; }
      catch { return (await c.match('./index.html')) || (await c.match('./')) || Response.error(); } })());
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
