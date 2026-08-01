/* ═══════════════════════════════════════════════════════════
   RFA.Learning — Service Worker (PWA)
   Caché de app shell + estrategia network-first para API
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'rfa-learning-v2';

const APP_SHELL = [
  '/',
  '/login',
  '/register',
  '/css/base.css',
  '/css/modern.css',
  '/css/shared.css',
  '/css/mobile.css',
  '/js/i18n.js',
  '/js/theme.js',
  '/js/shared.js',
  '/js/mobile-nav.js',
  '/manifest.json',
];

// ── Instalación: precachear app shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar cachés antiguas ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first para navegación, cache-first para estáticos ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar API ni rutas de autenticación
  if (url.pathname.startsWith('/api/')) return;

  // Solo GET
  if (request.method !== 'GET') return;

  // Navegación: network-first con fallback a caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Estáticos: cache-first con actualización en background
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
