const gulp = require('gulp');
const webp = require('gulp-webp');

const uglifyjs = require('uglify-es');
const composer = require('gulp-uglify/composer');
const minify = composer(uglifyjs, console);
const pump = require('pump');

const minifyCSS = require('gulp-minify-css');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');

const browserSync = require('browser-sync').create();

gulp.task('imgs', () =>
  gulp
    .src('img/*.jpg')
    .pipe(webp())
    .pipe(gulp.dest('img'))
);

gulp.task('scripts', done =>
  pump([gulp.src('js/*.js'), minify(), gulp.dest('js/dist')], done)
);

gulp.task('css', () =>
  gulp
    .src('css/styles.css')
    .pipe(minifyCSS())
    .pipe(rename('/styles_min.css'))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
    .pipe(gulp.dest('css'))
);

gulp.task('watch-browsersync', done => {
  browserSync.init({
    server: {
      baseDir: './',
      directory: true
    }
  });
  gulp.watch('css/*.css', gulp.series(gulp.task('css'), browserSync.reload));
  gulp.watch('js/*.js', gulp.series(gulp.task('scripts'), browserSync.reload));
  gulp.watch('index.html').on('change', browserSync.reload);
  gulp.watch('restaurant.html').on('change', browserSync.reload);
  done();
});

gulp.task('watch', done => {
  gulp.watch('css/*.css', gulp.task('css'));
  gulp.watch('js/*.js', gulp.task('scripts'));
  done();
});

gulp.task(
  'default',
  gulp.series(gulp.parallel('css', 'scripts'), gulp.task('watch')),
  () => {
    console.log('[gulp] finished');
  }
);
