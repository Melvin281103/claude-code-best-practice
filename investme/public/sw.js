// Service worker: lets InvestMe keep working (with the last data you loaded)
// even when your phone loses internet connection.
//
// How it works, in plain words:
// 1. "install"  -> we pre-save the app's shell (the empty page + icons)
// 2. "fetch"    -> every time the app asks for something over the network,
//                  we try the real network first. If that succeeds, we also
//                  save ("cache") a copy of the answer for later.
//                  If the network fails (offline), we hand back the last
//                  saved copy instead, so the app still shows something.
// 3. "activate" -> we delete old caches from previous versions of the app.

// Bump this name whenever you want to force everyone to get a fresh cache.
const CACHE_NAME = 'investme-cache-v1'

// The bare minimum needed to open the app with no network at all.
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

// --- INSTALL: save the app shell so the app can at least open offline ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  // Activate this new service worker as soon as it's done installing.
  self.skipWaiting()
})

// --- ACTIVATE: remove caches left over from older versions of the app ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

// --- FETCH: network-first, falling back to the cached "last session" copy ---
self.addEventListener('fetch', (event) => {
  // Only handle simple GET requests (skip Claude API calls, POSTs, etc.)
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Network worked: save a fresh copy for next time we're offline.
        const responseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        return networkResponse
      })
      .catch(() =>
        // Network failed (offline): serve the last cached version instead.
        // For page navigations with no exact match, fall back to index.html
        // so the React app can still boot and read data from localStorage.
        caches.match(event.request).then((cached) => cached || caches.match('/index.html'))
      )
  )
})
