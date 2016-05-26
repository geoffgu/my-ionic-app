import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {stream as wiredep} from 'wiredep';
import RevAll from 'gulp-rev-all';
import gulpSequence from 'gulp-sequence';
import revDel from 'gulp-rev-delete-original';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('styles', () => {
  return gulp.src('src/css/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/css'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', () => {
  return gulp.src('src/js/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/js'))
    .pipe(reload({stream: true}));
});

gulp.task('template', () => {
  return gulp.src(['src/templates/*.html'])
    .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest('.tmp/templates'));
});

gulp.task('template:build', () => {
  return gulp.src(['src/templates/*.html'])
    .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest('www/templates'));
});

gulp.task('images', () => {
  return gulp.src('src/img/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('.tmp/img'));
});

gulp.task('images:build', () => {
  return gulp.src('src/img/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('www/img'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('src/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'));
});

gulp.task('fonts:build', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('src/fonts/**/*'))
    .pipe(gulp.dest('www/fonts'));
});

gulp.task('widgets', () => {
  return gulp.src([
    'bower_components/**/*'
  ], {
    dot: true
  }).pipe(gulp.dest('.tmp/bower_components'));
});

gulp.task('extras', () => {
  return gulp.src([
    'src/*.*'
  ], {
    dot: true
  }).pipe(gulp.dest('.tmp'));
});

gulp.task('extras:build', () => {
  return gulp.src([
    'src/*.*'
  ], {
    dot: true
  }).pipe(gulp.dest('www'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'www']));

gulp.task('watch', function() {
  gulp.watch('bower.json', ['widgets']);
  gulp.watch('src/*.*', ['extras']);
  gulp.watch('src/img/**/*', ['images']);
  gulp.watch('src/templates/**/*.html', ['template']);
  gulp.watch('src/css/**/*.scss', ['styles']);
  gulp.watch('src/js/**/*.js', ['scripts']);
  gulp.watch('src/fonts/**/*', ['fonts']);
});

gulp.task('serve', gulpSequence('clean', ['styles', 'scripts', 'template', 'images', 'fonts', 'widgets', 'extras']));

var revAll = new RevAll({
  hashLength: 10,
  dontRenameFile: ['.html'],
  dontGlobal: [ /^\/favicon.ico$/ , '.bat', '.txt' ],
  dontUpdateReference: ['.html'],
  prefix: 'http://7xpx9u.com1.z0.glb.clouddn.com'
});

gulp.task('rev', () => {
  return gulp.src('www/**/*')
    .pipe(revAll.revision())
    .pipe(gulp.dest('www'))
    .pipe(revDel());
});

gulp.task('html', ['styles', 'scripts', 'template'], () => {
  return gulp.src(['src/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest('www'));
});

gulp.task('build', gulpSequence('clean', ['html', 'template:build', 'images:build', 'fonts:build', 'extras:build'], 'rev'));
