/* Enkel servicearbetare: hämtar alltid färskt från nätet och faller tillbaka på cachen när man är offline. */
const CACHE = 'angelradio-v5';
const SHELL = ['./', 'index.html', 'js/app.js', 'js/device.js', 'js/sim.js', 'js/melody.js', 'js/hex.js', 'js/stk500.js', 'js/esp32.js', 'icon.svg', 'icon-192.png', 'favicon-32.png', 'manifest.webmanifest', 'firmware/releases.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
