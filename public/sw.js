
// Service Worker for NotebookLM
const CACHE_NAME = 'notebooklm-cache-v1';

// Files to cache
const filesToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service worker caching files');
        return cache.addAll(filesToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service worker removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Attempt to get the resource from the cache
        if (response) {
          console.log('Service worker serving from cache:', event.request.url);
          return response;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache responses with errors
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();
            
            // Add the new response to the cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Return empty response for other requests
            return new Response();
          });
      })
  );
});
