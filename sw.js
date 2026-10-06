// BestPick service worker
const CACHE = 'bestpick-v1.1.2-20261006';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
// Face model + MediaPipe runtime: cached on first successful download so face checking works offline afterwards.
const RUNTIME = [/^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\//, /^https:\/\/storage\.googleapis\.com\/mediapipe-models\//];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('bestpick-') && k !== CACHE && k !== 'bestpick-models').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (e.request.method !== 'GET') return;
  if (RUNTIME.some(r => r.test(u))) {
    e.respondWith(caches.open('bestpick-models').then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  if (new URL(u).origin !== location.origin) return;
  // App shell: network first so updates arrive, cache when offline.
  e.respondWith(fetch(e.request).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
