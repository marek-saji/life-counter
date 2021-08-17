/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'v1';

async function cacheNetworkResponse (
    cache,
    request,
    responsePromise,
)
{
    const networkResponse = await responsePromise;
    await cache.put(request, networkResponse.clone());
}

async function staleWhileRevalidate (event)
{
    // Cache resolution is fast, so we await for it inline
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    const networkResponsePromise = fetch(event.request);

    // When serving from the cache, we’ll be responding to fetch event
    // before network request finishes. Tell that Service Worker should
    // not be terminated before this is done
    event.waitUntil(cacheNetworkResponse(
        cache,
        event.request,
        networkResponsePromise,
    ));

    return cachedResponse || networkResponsePromise;
}

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET' || url.pathname.startsWith('/browser-sync/'))
    {
        return;
    }

    event.respondWith(staleWhileRevalidate(event));
});
