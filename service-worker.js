/**
 * Service Worker for RadioWave
 * Provides offline support and faster loading
 */

const CACHE_VERSION = '1.0.0'; // Update this version when assets change
const CACHE_NAME = `radiowave-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/themes.css',
    '/css/styles.css',
    '/js/app.js',
    '/js/audio-manager.js',
    '/js/radio-api.js',
    '/js/visualizer.js',
    '/js/themes.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
                throw error; // Prevent installation with incomplete cache
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activation complete');
            return self.clients.claim(); // Take control immediately
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip radio streams and external APIs
    const url = new URL(event.request.url);
    const ALLOWED_EXTERNAL_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    const isAllowedExternal = ALLOWED_EXTERNAL_HOSTS.some(host => url.hostname.includes(host));
    if (url.hostname !== self.location.hostname && !isAllowedExternal) {
        return; // Let radio streams and APIs go directly to network
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // Cache hit - return cached response
                    return response;
                }

                // Not in cache - fetch from network
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Clone the response (can only read once)
                    const responseToCache = response.clone();

                    // Cache static assets only
                    if (event.request.url.includes('.css') ||
                        event.request.url.includes('.js') ||
                        event.request.url.includes('.png') ||
                        event.request.url.includes('.jpg') ||
                        event.request.url.includes('.woff')) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }

                    return response;
                }).catch((error) => {
                    console.error('[Service Worker] Fetch failed:', error);
                    // Could return a custom offline page here
                    throw error;
                });
            })
    );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
