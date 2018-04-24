/*eslint-env node */

const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine-phantom');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('imagemin');
const pngquant = require('imagemin-pngquant');
const webp = require('gulp-webp');

gulp.task('jpgToWebp', () =>
  gulp
    .src('img/**/*.jpg')
    .pipe(webp())
    .pipe(gulp.dest('img/'))
);

gulp.task('scripts', () => {
  return gulp
    .src('js/**/*.js')
    .pipe(babel())
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', () => {
  return gulp
    .src('js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('all.js'))
    .pipe(uglify())

    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-html', () => {
  return gulp.src('./index.html').pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', () => {
  return imagemin(['img/*'], 'dist/img', { use: [pngquant()] });
  // return gulp
  // 	.src('img/*')
  // 	.pipe(
  // 		imagemin('dist/img', {
  // 			progressive: true,
  // 			use: [pngquant()]
  // 		})
  // 	)
  // 	.pipe(gulp.dest('dist/img'));
});

gulp.task('styles', () => {
  return gulp
    .src('sass/**/*.scss')
    .pipe(
      sass({
        outputStyle: 'compressed'
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions']
      })
    )
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

gulp.task('lint', () => {
  return (
    gulp
      .src(['js/**/*.js'])
      // eslint() attaches the lint output to the eslint property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failOnError last.
      .pipe(eslint.failOnError())
  );
});

gulp.task('tests', () => {
  return gulp.src('tests/spec/extraSpec.js').pipe(
    jasmine({
      integration: true,
      vendor: 'js/**/*.js'
    })
  );
});

gulp.task(
  'dist',
  gulp.parallel('copy-html', 'copy-images', 'styles', 'lint', 'scripts-dist')
);

gulp.task(
  'default',
  gulp.parallel('copy-html', 'copy-images', 'styles', 'lint', 'scripts'),
  () => {
    gulp.watch('sass/**/*.scss', gulp.task('styles'));
    gulp.watch('js/**/*.js', gulp.task('lint'));
    gulp.watch('/index.html', gulp.task('copy-html'));
    gulp.watch('./dist/index.html').on('change', browserSync.reload);
    gulp.watch('./build/index.html').on('change', browserSync.reload);

    browserSync.init({
      server: './dist'
    });
  }
);
