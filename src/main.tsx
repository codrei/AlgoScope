import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
import App from './App.tsx';

// index.html already explained that this browser is too old (only reached when testing that message)
if (!(window as Window & { __algoscopeTooOld?: boolean }).__algoscopeTooOld) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Offline support (production only): the service worker answers from the cache when there is no
// internet. Half a minute after the page opens, every file of the app (all five languages' grammars,
// fonts, the editor) is saved, so the installed app also opens and runs offline. Files of older
// versions are removed.
const CACHE = 'algoscope-v1';
async function saveForOffline(base: string) {
  const list: string[] = await (await fetch(`${base}precache.json`, { cache: 'no-store' })).json();
  const urls = list.map((f) => new URL(f, document.baseURI).href);
  const cache = await caches.open(CACHE);
  for (const url of urls) {
    // the page itself is always refreshed; hashed files never change, so a saved copy is kept
    if (!url.endsWith('/') && (await cache.match(url, { ignoreVary: true }))) continue;
    await cache.add(url).catch(() => undefined);
  }
  const keep = new Set(urls);
  for (const req of await cache.keys()) {
    if (new URL(req.url).pathname.includes('/assets/') && !keep.has(req.url)) await cache.delete(req);
  }
  document.documentElement.dataset.offline = 'ready';
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker
    .register(`${base}sw.js`)
    // not right away: when a whole class opens AlgoScope at once on one Wi-Fi, the first page loads come first
    .then(() => window.setTimeout(() => saveForOffline(base).catch(() => undefined), 30000))
    .catch(() => undefined);
}
