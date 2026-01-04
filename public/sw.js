// Service Worker for Metric Chess PWA
const CACHE_NAME = 'metric-chess-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/chess.js',
  './js/render.js',
  './js/fontawesome-config.js',
  './js/stockfish/ffish.js',
  './js/stockfish/stockfish.js',
  './js/stockfish/stockfish.worker.js',
  './js/stockfish/stockfish.wasm',
  './js/stockfish/metric-stockfish-worker.js',
  './js/stockfish/stockfish-worker-wrapper.js',
  './fonts/VanadiumMono-SemiExtended.woff2',
  './fonts/VanadiumSans-SemiExtended.woff2',
  './icons/chess-icon.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});