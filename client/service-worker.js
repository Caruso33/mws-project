const shellCacheName = 'restaurantReviews-v1';
const dataCacheName = 'restaurantReviewsData-v1';
const jsonIndexDB = 'restaurantJsonRequests-v1';
const logging = false;

const filesToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/css/styles.css',
  '/css/responsive.css',
  '/data/restaurants.json',
  '/img/10.jpg',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg'
];

self.addEventListener('install', event => {
  if (logging) console.log('[ServiceWorker] installed');
  event.waitUntil(
    caches
      .open(shellCacheName)
      .then(cache => {
        if (logging) console.log('[ServiceWorker] caching app shell');
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
            if (logging) console.log('[ServiceWorker] removing old cache', key);
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
          if (logging)
            console.log(
              '[ServiceWorker] fetches from cache',
              event.request.url
            );
        }

        return (
          response ||
          fetch(event.request)
            .then(response => {
              if (!response) {
                if (logging)
                  console.log(
                    '[ServiceWorker] has no response from fetch',
                    event.request.url
                  );
              }

              return caches.open(dataCacheName).then(cache => {
                cache.put(event.request.url, response.clone());
                if (logging)
                  console.log(
                    '[ServiceWorker] fetched & cached',
                    event.request.url
                  );

                return response;
              });
            })
            .catch(err => console.log('[ServiceWorker] fetching failed', err))
        );
      })
      .catch(err => console.log('[ServiceWorker] cache matching failed', err))
  );
});
