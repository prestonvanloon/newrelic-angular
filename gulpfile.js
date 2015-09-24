var gulp = require('gulp');
var Server = require('karma').Server;
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

function runTest(watch, done) {
  var conf = {
    configFile: __dirname + '/test/karma.conf.js',
    singleRun: !watch,
    autoWatch: watch
  };
  
  return new Server(conf, done).start();
}

gulp.task('test', runTest.bind(null, false));
gulp.task('test:watch', runTest.bind(null, true));

gulp.task('dist', ['test'], function () {
  
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


gulp.task('default', ['test:watch']);