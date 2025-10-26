// service-worker.js
// Service Worker pour Synkro PWA
// Cache les ressources pour un fonctionnement offline

const CACHE_NAME = 'synkro-v2.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  
  // Force le nouveau service worker à devenir actif immédiatement
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  // Prend le contrôle immédiatement
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ne pas cacher les requêtes API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Stratégie: Network First, fallback to Cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone la réponse car elle ne peut être lue qu'une fois
        const responseClone = response.clone();
        
        // Mettre en cache la nouvelle réponse
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // En cas d'échec, essayer de récupérer depuis le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache', request.url);
            return cachedResponse;
          }
          
          // Si pas de cache et offline, retourner une page offline
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Gestion des messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification push (pour future implémentation)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification Synkro',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'synkro-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('Synkro', options)
  );
});

// Click sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
