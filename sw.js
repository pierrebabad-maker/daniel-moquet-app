var CACHE_NAME = 'babad-dm-v21';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Ne jamais cacher les appels API distants (GitHub Gist + Railway DM-data)
  // sinon les données ne se rafraîchissent jamais.
  var url = event.request.url;
  if (url.indexOf('api.github.com') !== -1 ||
      url.indexOf('/api/dm-data') !== -1 ||
      url.indexOf('/api/pointage') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
