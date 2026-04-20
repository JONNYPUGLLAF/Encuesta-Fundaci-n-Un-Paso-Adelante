// Service Worker — Ficha Diagnóstico Fundación Dar un Paso Adelante
const CACHE_NAME = 'ficha-shuar-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación — cachear recursos
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando archivos');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación — limpiar caches viejos
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — servir desde cache si no hay internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Tenemos en cache — devolver inmediatamente
        // En background intentar actualizar
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }
      // No está en cache — intentar red
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
        });
        return response;
      }).catch(() => {
        // Sin red y sin cache — mostrar página offline si es navegación
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
