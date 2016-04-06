var gulp = require('gulp');
var Server = require('karma').Server;
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');

var config = {
  lint: {
    src: ['src/**/*.js', 'test/**/*.spec.js']
  },
  dist: {
    files: [
      'src/**/*.js'
    ],
    concat: 'newrelic-angular.js',
    min: 'newrelic-angular.min.js'
  }
};


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

gulp.task('dist', ['lint', 'test'], function () {

  var files = config.dist.files;

  gulp.src(files)
    .pipe(concat(config.dist.min))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));

  gulp.src(files)
    .pipe(concat(config.dist.concat))
    .pipe(gulp.dest('dist'));
});

gulp.task('lint', function(){
  return gulp.src(config.lint.src)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('watch', function(){
  gulp.watch(config.lint.src, ['lint', 'test']);
});

gulp.task('default', ['watch']);
