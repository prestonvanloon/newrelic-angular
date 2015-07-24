var gulp = require('gulp');
var karma = require('gulp-karma');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var testFiles = [
  'node_modules/angular/angular.js',
  'node_modules/angular-mocks/angular-mocks.js',
  'src/**/*.js',
  'test/**/*.spec.js'
];

gulp.task('test', function () {
  // Be sure to return the stream
  return gulp.src(testFiles)
    .pipe(karma({
      configFile: 'test/karma.conf.js',
      action: 'run'
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('default', function () {
  gulp.src(testFiles)
    .pipe(karma({
      configFile: 'test/karma.conf.js',
      action: 'watch'
    }));
});

gulp.task('dist', function () {
  var files = [
    'src/**/*.js',
    'node_modules/angulartics/src/angulartics.js',
    'node_modules/angulartics/src/angulartics-newrelic-insights.js'
  ];

  gulp.src(files)
    .pipe(concat('newrelic-angular.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));

  gulp.src(files)
    .pipe(concat('newrelic-angular.js'))
    .pipe(gulp.dest('dist'));
});
