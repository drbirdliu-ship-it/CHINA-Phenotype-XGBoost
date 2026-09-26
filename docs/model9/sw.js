// Retire earlier cached models when a connected browser receives this update.
const VERSION = '2026-09-26-age-corrected';
const CACHE = 'china-release-model9-' + VERSION;
const ASSETS = ['./index.html', './styles.css', './app.mjs', './engine.mjs', './model.mjs'].map(path => path + '?v=' + VERSION).concat(['./manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png']);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE && (key.startsWith('china-release-model9-') || key.startsWith('china-phenotype-nine-'))).map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.filter(client => client.url.startsWith(self.registration.scope)).map(client => client.navigate(client.url).catch(() => {})));
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request, { cache: 'no-store' });
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const page = await cache.match(new URL('./index.html?v=' + VERSION, self.registration.scope).href);
        if (page) return page;
      }
      return new Response('Reconnect to load the current calculator.', { status: 503 });
    }
  })());
});
