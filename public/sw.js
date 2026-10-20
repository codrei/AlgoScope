// AlgoScope offline support: after the first visit the app opens and runs without internet.
// The page saves every file of the app in this cache a few seconds after it opens (see main.tsx).
const CACHE = 'algoscope-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const scopePath = new URL(self.registration.scope).pathname;
const isAppPage = (url) => url.pathname === scopePath || url.pathname === `${scopePath}index.html`;
// servers add "Vary: Origin" or "Vary: Accept-Encoding", which would make a saved file count only for an
// identical request; every request for an AlgoScope file gets the same file, so that is ignored
const ANY = { ignoreVary: true };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // the page: network first so updates arrive, the saved copy offline. Every link to AlgoScope
  // (?example=…&run=1, the installed app's start page) is the same page, so it is kept once,
  // under the app's own address.
  if (req.mode === 'navigate' || isAppPage(url)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && isAppPage(url)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(self.registration.scope, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(isAppPage(url) ? self.registration.scope : req, ANY)
            .then((hit) => hit || caches.match(self.registration.scope, ANY))
            .then((hit) => hit || Response.error()),
        ),
    );
    return;
  }

  // scripts, styles, fonts, grammars: answer from the cache, refresh in the background
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, ANY);
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        // offline or cancelled (the page moved on): use the cached copy, or report a normal network error
        .catch(() => hit || Response.error());
      return hit || fresh;
    }),
  );
});
