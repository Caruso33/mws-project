const gulp = require('gulp');
const webp = require('gulp-webp');

const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

var minifyCSS = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');

const browserSync = require('browser-sync').create();

gulp.task('imgs', () =>
  gulp
    .src('img/*.jpg')
    .pipe(webp())
    .pipe(gulp.dest('img/'))
);

gulp.task('scripts', () =>
  gulp
    .src('js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['env']
      })
    )
    .pipe(
      uglify({
        mangle: true,
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: true
        }
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('js/dist'))
);

gulp.task('css', () =>
  gulp
    .src('css/*.css')
    .pipe(minifyCSS())
    .pipe(rename('styles_min.css'))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
    .pipe(gulp.dest('css'))
);

gulp.task('default', gulp.parallel('css', 'scripts'), () => {
  gulp.watch('css/*.css', gulp.task('css'));
  gulp.watch('js/*.js', gulp.task('scripts'));
  gulp.watch('index.html').on('change', browserSync.reload);
  gulp.watch('restaurant.html').on('change', browserSync.reload);

  browserSync.init({
    server: {
      baseDir: './'
    }
  });
});
