'use strict';
let restaurants, neighborhoods, cuisines;
var map;
var markers = [];
var lazyImages = [];
const logging = false;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  serviceWorker();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  window.localStorage.getItem('restaurantData', function (err, restaurantList) {
    if (restaurantList) {
      self.restaurantList = restaurantList;
    } else {
      DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) {
          // Got an error
          console.error(error);
        } else {
          self.neighborhoods = neighborhoods;
          fillNeighborhoodsHTML();
        }
      });
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize map container with image, and load Google map when clicked,
 * initMap called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  const image = document.createElement('img');
  const rootImgSrc = '/img/webp/maps-';
  image.src = `${rootImgSrc}500.webp`;
  image.srcset = `${rootImgSrc}360.webp 360w, ${rootImgSrc}500.webp 500w, ${rootImgSrc}700.webp 700w, ${rootImgSrc}900.webp 900w, ${rootImgSrc}1200.webp 1200w, ${rootImgSrc}1600.webp 1600w`;
  image.alt = `Google Maps Preview`;
  image.setAttribute('tabindex', '0');

  const mapDiv = document.getElementById('map');
  mapDiv.appendChild(image);

  // TODO: FOCUS WITH TAB AND MAKE MAP LOADABLE WITH SPACE / ENTER
  // TODO: ADDEVENTLISTENER SHOULD ONLY FIRE ONCE??????????????????????????????
  mapDiv.addEventListener(
    'click',
    e => {
      self.map = new google.maps.Map(mapDiv, {
        zoom: 12,
        center: loc,
        scrollwheel: false
      });

      const idleListener = google.maps.event.addListenerOnce(
        self.map,
        'idle',
        () => {
          let iframe = document.querySelector('iframe');
          iframe.setAttribute('aria-hidden', 'true');
          iframe.setAttribute('tabindex', '-1');
        }
      );
      updateRestaurants();
    },
    true
  );

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  lazyLoadImages();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const fav = document.createElement('span');
  if (restaurant.is_favorite) {
    fav.innerHTML = `${String.fromCodePoint(0x1f31f)} This is a favorite`;
  }
  li.append(fav);

  const fig = document.createElement('figure');
  const image = document.createElement('img');
  const figcap = document.createElement('figcaption');

  fig.className = 'restaurant-fig';
  image.className = 'restaurant-img';
  figcap.className = 'restaurant-figcap';

  const placeholderImg = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = '';
  image.alt = `An impression of restaurant ${restaurant.name}`;
  figcap.innerHTML = `Restaurant ${restaurant.name}`;

  // srcset: serving the right img size to the right viewport width
  const rawImg = placeholderImg.slice(0, -17);

  image['data-src'] = `${rawImg}.webp`;
  image['data-srcset'] = `${rawImg}-250_small-min.webp 250w,
                  ${rawImg}-400_medium-min.webp 400w`;
  image.sizes = `(min-width: 434px) 300px, calc(100% - 137px)`;

  fig.append(image);
  fig.append(figcap);
  li.append(fig);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  more.setAttribute(
    'aria-label',
    `Press to view details of restaurant ${restaurant.name}`
  );
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
// Lazy loading for images as from:
// https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
const lazyLoadImages = () => {
  const lazyImages = [].slice.call(
    document.querySelectorAll('.restaurant-img')
  );

  if ('IntersectionObserver' in window) {
    let lazyImageObserver = new IntersectionObserver(function (
      entries,
      observer
    ) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage['data-src'];
          lazyImage.srcset = lazyImage['data-srcset'];
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(lazyImage => {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    console.log('LazyLoadImages failed');
  }
};

/**
 * Add service-worker
 */
const serviceWorker = () => {
  if (!navigator.serviceWorker) {
    return;
  }

  navigator.serviceWorker
    .register('/service-worker.js', { scope: '/' })
    .then(reg => {
      if (logging) {
        console.log('[ServiceWorker] registered');
      }
      // if (reg.waiting) {
      //   console.log('[ServiceWorker] updated version is ready to be installed');
      // }
      // if (reg.installing) {
      //   console.log('[ServiceWorker] updated version is installing');
      // }
      // reg.addEventListener('updatefound', function(e) {
      //   console.log('[ServiceWorker] new ServiceWorker arrival');
      // });
    })
    .catch(err => console.log('[ServiceWorker] registration failed!', err));
};
