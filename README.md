# Mobile Web Specialist Certification Course

#### Stage 3 - Solution

### Dependencies

Using following server on port 1337
[Server repo](https://github.com/udacity/mws-restaurant-stage-3)

### Remarks on implementation

* Lazy-loading for images
* webp images (except google maps)
* separating critcal css in style tags
* minifying of css and js-files
* using localforage for indexedDB
* skip link for google maps

### Remarks on Lighthouse-audit

* the audit json file and
* screenshots of the audit

  can be found in [this directory](/audit_info/)

#### Todo-Notes

* famililiarize with node Server
* input form for Reviews, a11y it
* posting to Server

  POST http://localhost:1337/reviews/
  {
  "restaurant_id": <restaurant_id>,
  "name": <reviewer_name>,
  "rating": <rating>,
  "comments": <comment_text>
  }

* putting to a Server

PUT
http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true
http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=false

* switch to native localstorage / dexie
* google maps splash screen in webp
* google maps lazy loading
* background sync - offline
* inline style gulp it
* minify css
