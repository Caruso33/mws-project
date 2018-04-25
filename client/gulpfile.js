const gulp = require('gulp');
const webp = require('gulp-webp');

const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

gulp.task('default', () =>
  gulp
    .src('img/*.jpg')
    .pipe(webp())
    .pipe(gulp.dest('img/'))
);

gulp.task('scripts-dist', () => {
  return gulp
    .src('js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['env']
      })
    )
    .pipe(concat('all.js'))
    .pipe(uglify())

    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'));
});
