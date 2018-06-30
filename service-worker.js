const shellCacheName = 'restaurantReviews-v1';
const dataCacheName = 'restaurantReviewsData-v1';
const logging = false;

const filesToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/js/dist/main.js',
  '/js/dist/dbhelper.js',
  '/js/dist/restaurant_info.js',
  '/css/styles_min.css'
];

self.addEventListener('install', event => {
  if (logging) {
    console.log('[ServiceWorker] installed');
  }
  event.waitUntil(
    caches
      .open(shellCacheName)
      .then(cache => {
        if (logging) {
          console.log('[ServiceWorker] caching app shell');
        }
        return cache.addAll(filesToCache);
      })
      .catch(err => console.log(err, event))
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] activated');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== shellCacheName && key !== dataCacheName) {
            if (logging) {
              console.log('[ServiceWorker] removing old cache', key);
            }
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        if (response) {
          if (logging) {
            console.log(
              '[ServiceWorker] fetches from cache',
              event.request.url
            );
          }
        }

        return (
          response ||
          fetch(event.request)
            .then(response => {
              if (!response) {
                if (logging) {
                  console.log(
                    '[ServiceWorker] has no response from fetch',
                    event.request.url
                  );
                }
              }
              return caches.open(dataCacheName).then(cache => {
                // restaurant requests are stored in localStorage
                if (
                  event.request.url.startsWith(
                    'http://localhost:1337/restaurants'
                  )
                ) {
                  return response;
                }
                cache.put(event.request.url, response.clone());
                if (logging) {
                  console.log(
                    '[ServiceWorker] fetched & cached',
                    event.request.url
                  );
                }

                return response;
              });
            })
            .catch(err => console.log('[ServiceWorker] fetching failed', err))
        );
      })
      .catch(err => console.log('[ServiceWorker] cache matching failed', err))
  );
});
