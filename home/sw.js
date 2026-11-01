// Network first so updates arrive right away; the cache is only an offline fallback.
// Padayon (/padayon/) has its own service worker, so it's left alone here.
const CACHE = 'practice-v2';
const SHELL = ['./', 'index.html', 'shared/cloud.js', 'words/', 'chess/', 'chess/app.js', 'chess/lessons.js', 'chess/openings.js', 'chess/seed.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('practice-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/padayon/')) return;
  e.respondWith(fetch(e.request, {cache: 'no-cache'}).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
