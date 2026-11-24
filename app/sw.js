/*
 * Olympus Chess Academy - lightweight PWA service worker
 * Online-first: new HTML, JS and CSS are requested from GitHub Pages first.
 * Cache is only a fallback; this does NOT make Supabase/cloud functions offline.
 */

const CACHE_NAME = "olympus-app-v1";
const APP_BASE = self.registration.scope;
const appUrl = (path) => new URL(path, APP_BASE).toString();

const PRECACHE_URLS = [
  "login.html",
  "logo.png",
  "favicons.png",
  "pwa-icons/olympus-192.png",
  "pwa-icons/olympus-512.png"
].map(appUrl);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    // Deliberately do NOT call skipWaiting(): do not interrupt an active class.
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("olympus-app-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Do not cache Supabase, CDNs, Lichess, or any other third-party service.
  if (url.origin !== self.location.origin) return;

  // Page navigations: always ask GitHub Pages for the latest page first.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        return (
          await caches.match(request) ||
          await caches.match(appUrl("login.html")) ||
          new Response("Olympus is offline. Reconnect to the internet and reopen the app.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      }
    })());
    return;
  }

  // Cache only normal app files as they are used; leave large media/model files alone.
  const isAppAsset = /\.(?:mjs|cjs|js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|wasm|json|pdf|pgn|txt)$/i.test(url.pathname);
  if (!isAppAsset) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: "no-store" });
      if (response && response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      return (await caches.match(request)) || new Response("", { status: 504 });
    }
  })());
});
