'use strict';
let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  const figcap = document.getElementById('restaurant-figcap');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `An impression of restaurant ${restaurant.name}`;
  figcap.innerHTML = `Restaurant ${restaurant.name}`;

  // srcset: serving the right img size to the right viewport width
  const origImg = image.src.slice(0, -17);
  image.srcset = `${origImg}-250_small-min.webp 250w,
                  ${origImg}-400_medium-min.webp 400w,
                  ${origImg}-600_large-min.webp 600w,
                  ${origImg}-800_orig-min.webp 800w
                  `;
  image.sizes = `90vw`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchRestaurantReviewsById(restaurant.id, (error, reviews) => {
    if (!reviews) {
      console.error(error);
      return;
    }
    self.restaurant['reviews'] = reviews;
    // fill reviews
    fillReviewsHTML(reviews);
  });
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = reviews => {
  console.log(`fillReviewsHTML: ${reviews}`);
  const container = document.getElementById('reviews-container');
  if (container.childNodes.length < 4) {
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
  }
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  const form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', 'http://localhost:1337/reviews');
  // form.setAttribute(
  //   'onsubmit',
  //   `window.location.replace='/restaurant.html?id=${self.restaurant.id}'`
  //   `return (function() {
  //     console.log('onsubmit function');
  //   window.location.replace("/restaurant.html?id=${self.restaurant.id}");
  //   return false;
  // })()`
  // );
  form.classList.add('newReview');

  const textarea = document.createElement('textarea');
  textarea.setAttribute('placeholder', 'Your review goes here...');
  textarea.setAttribute('name', 'comments');

  const inputForId = document.createElement('input');
  inputForId.setAttribute('name', 'restaurant_id');
  inputForId.setAttribute('value', self.restaurant.id);
  inputForId.style.display = 'none';

  const input = document.createElement('input');
  input.setAttribute('name', 'name');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Your Name');

  const button = document.createElement('button');
  button.innerHTML = 'Create review';
  button.setAttribute('type', 'submit');

  // <option value="volvo">Volvo</option>
  const select = document.createElement('select');
  select.setAttribute('name', 'rating');

  let optionText = '';
  for (let i = 1; i < 6; i++) {
    optionText += `${String.fromCodePoint(0x2b50)}`;
    this[`option${i}`] = document.createElement('option');
    this[`option${i}`].setAttribute('value', i);
    this[`option${i}`].innerHTML = `${optionText} ${i} Stars`;
    select.appendChild(this[`option${i}`]);
  }

  button.innerHTML = 'Create review';
  button.setAttribute('type', 'submit');

  form.appendChild(inputForId);
  form.appendChild(input);
  form.appendChild(textarea);
  form.appendChild(select);
  form.appendChild(button);

  ul.appendChild(form);

  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add('review-author');

  // Date is now a span inside the reviewer's name
  const date = document.createElement('span');

  const reviewDate = new Date(review.createdAt);
  const month = reviewDate.getUTCMonth() + 1; //months from 1-12
  const day = reviewDate.getUTCDate();
  const year = reviewDate.getUTCFullYear();

  date.innerHTML = year + '/' + month + '/' + day;
  date.classList.add('review-date');
  name.appendChild(date);

  li.appendChild(name);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add('review-rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('review-comments');
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb.childNodes.length < 4) {
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
  }
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
