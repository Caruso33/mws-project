/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static async fetchRestaurants(callback) {
    window.localStorage.getItem('restaurantsJson', (err, restaurants) => {
      if (restaurants) {
        return callback(null, restaurants);
      }
    });
    try {
      const response = await fetch(`${DBHelper.DATABASE_URL}/restaurants`);
      const responseJson = await response.json();
      callback(null, responseJson);
      window.localStorage.setItem(
        'restaurantsJson',
        JSON.stringify(responseJson)
      );
    } catch (e) {
      callback(e.message, null);
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    window.localStorage.getItem(
      `restaurantJson?id=${id}`,
      (err, restaurant) => {
        if (restaurant) {
          return callback(null, restaurant);
        }
      }
    );
    try {
      const response = await fetch(
        `${DBHelper.DATABASE_URL}/restaurants/${id}`
      );
      if (response) {
        // Got the restaurant
        const responseJson = await response.json();
        window.localStorage.setItem(
          `restaurantJson?id=${id}`,
          JSON.stringify(responseJson)
        );
        return callback(null, responseJson);
      } else {
        // Restaurant does not exist in the database
        return callback('Restaurant does not exist', null);
      }
    } catch (e) {
      callback(e.message, null);
    }
  }

  /**
   *  Fetch all reviews one restaurant
   */
  static async fetchRestaurantReviewsById(id, callback) {
    window.localStorage.getItem(`reviewsJson?id=${id}`, (err, reviews) => {
      if (reviews) {
        return callback(null, reviews);
      }
    });
    try {
      const response = await fetch(
        `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`
      );
      const responseJson = await response.json();
      window.localStorage.setItem(
        `reviewsJson?id=${id}`,
        JSON.stringify(responseJson)
      );
      callback(null, responseJson);
    } catch (e) {
      callback(e.message, null);
    }
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/webp/${restaurant.id}-placeholder.webp`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
