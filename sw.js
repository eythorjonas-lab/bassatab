// Bassatab offline: keep the app on the phone, refresh it in the background when online.
const CACHE = 'bassatab-8d89a66';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ours = url.origin === location.origin;
  const libs = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)$/.test(url.hostname);
  if (!ours && !libs) return;
  if (req.mode === 'navigate' && ours){
    e.respondWith(caches.open(CACHE).then(async c => {
      try { const r = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(no, 3500))]); if (r && r.ok){ c.put('./index.html', r.clone()); return r; } } catch(err){}
      return (await c.match('./index.html')) || (await c.match(req)) || Response.error();
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: ours });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit){ e.waitUntil(net); return hit; }
    return (await net) || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
