var shellCacheName = 'restaurantReviews-v1';
var dataCacheName = 'restaurantReviewsData-v1';

var filesToCache = [
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
  console.log('ServiceWorker installed');
  event.waitUntil(
    caches.open(shellCacheName).then(cache => {
      console.log('ServiceWorker caching app shell');
      return cache.addAll(filesToCache);
    })
    .catch(err => console.log(err, event))
  );
});

self.addEventListener('activate', event => {
  console.log('ServiceWorker activated')
    event.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== shellCacheName && key !== dataCacheName) {
            console.log('ServiceWorker removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
    );
});

self.addEventListener('fetch', event => {
  const googleMapsApi = 'https://maps.googleapis.com';
  // if (event.request.url.startsWith(googleMapsApi)) {

    event.respondWith(
      caches.match(event.request).then(response => {
        if(response) {
          console.log('ServiceWorker fetches from cache', event.request.url);
          return response || fetch(event.request);
        }
        fetch(event.request).then(response => {
          if(!response) {
            console.log('ServiceWorker has no response from fetch');
            return response;
          }
          return caches.open(dataCacheName).then(cache => {
            cache.put(event.request.url, response.clone());
            console.log('ServiceWorker fetched & cached', event.request.url);
            return response;
          });
        })
        .catch(err => console.log('Fetching failed', err));
      })
    );
  // }
});
