// Basic service worker for ShipSense PWA
// Provides offline caching for the app shell

const CACHE_NAME = 'shipsense-v1';
const SHELL_FILES = [
	'/',
	'/manifest.json',
	'/icon-192.svg'
];

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
	// Network-first for API/data calls, cache-first for static
	if (event.request.url.includes('/api/') || event.request.url.includes('convex')) {
		return; // Don't cache API calls
	}

	event.respondWith(
		caches.match(event.request).then((cached) => {
			const fetchPromise = fetch(event.request).then((response) => {
				if (response.ok && response.type === 'basic') {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
				}
				return response;
			});
			return cached || fetchPromise;
		})
	);
});
