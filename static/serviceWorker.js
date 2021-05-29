self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/browser-sync/')) {
        return;
    }

    event.respondWith(
        caches.open('v1').then(cache =>
            Promise.any([
                cache.match(event.request),
                fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                })
            ])
        )
    )
});
