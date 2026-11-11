// خدمة التطبيق: الشبكة أولاً (عشان التحديثات توصل فوراً)، والكاش احتياط لو انقطع النت.
// الخطوط والأيقونات من الكاش مباشرة لأنها ما تتغير.
const V = 'tarteeb-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  const stat = /\.(woff2|png)$/.test(u.pathname);
  if (stat) {
    e.respondWith(caches.match(req).then(h => h || fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); return r; })));
    return;
  }
  e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; })
    .catch(() => caches.match(req).then(h => h || caches.match('/'))));
});
