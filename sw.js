// Network first for app files so updates arrive; cache as an offline fallback.
const CACHE = 'padayon-v108';
const SHELL = ['./', 'index.html', 'learn.js', 'mega.js', 'path.js', 'fixes.js', 'pics.js', 'examples.js', 'stories.js', 'music.js', 'cast.js', 'grammar.js', 'real.js', 'app.js', 'geo_lang.js', 'geo.js', 'numbers.js', 'map.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'img/darkness.webp', 'img/binko.webp', 'img/binko-face.webp', 'img/green-face.webp', 'img/ollie-face.webp', 'img/quickare-face.webp', 'img/triton-face.webp'];
// cache: 'reload' skips the browser's own short-term cache, so an update never mixes old and new files
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('pack.bin') || u.pathname.includes('/voice/')) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match(e.request, { ignoreSearch: true }))));
});
