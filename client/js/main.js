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
fetchNeighborhoods = () => {
  window.localforage.getItem('restaurantData', function(err, restaurantList) {
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
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
fetchCuisines = () => {
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
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
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
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
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
resetRestaurants = restaurants => {
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
fillRestaurantsHTML = (restaurants = self.restaurants) => {
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
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const fig = document.createElement('figure');
  const image = document.createElement('img');
  const figcap = document.createElement('figcaption');

  fig.className = 'restaurant-fig';
  image.className = 'restaurant-img';
  figcap.className = 'restaurant-figcap';

  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `An impression of restaurant ${restaurant.name}`;
  figcap.innerHTML = `Restaurant ${restaurant.name}`;

  // srcset: serving the right img size to the right viewport width
  const origImg = image.src.slice(0, -17);
  image['data-src'] = `${origImg}.webp`;
  image['data-srcset'] = `${origImg}-250_small-min.webp 250w,
                  ${origImg}-400_medium-min.webp 400w`;
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
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

lazyLoadImages = () => {
  const lazyImages = [].slice.call(
    document.querySelectorAll('.restaurant-img')
  );
  // console.log(lazyImages[3].attributes[1]);
  if ('IntersectionObserver' in window) {
    let lazyImageObserver = new IntersectionObserver(function(
      entries,
      observer
    ) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage['data-src'];
          // console.log(lazyImage.src);
          lazyImage.srcset = lazyImage['data-srcset'];
          // lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
  }
};

/**
 * Add service-worker
 */
function serviceWorker() {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
    .register('/service-worker.js', { scope: '/' })
    .then(reg => {
      if (logging) console.log('[ServiceWorker] registered');
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
}
