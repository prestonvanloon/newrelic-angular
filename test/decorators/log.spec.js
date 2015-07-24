(function () {
  'use strict';

  describe('$log decorator', function () {
    var $log, $window, errorMessage = 'Something bad happened!';;
    beforeEach(module('newrelic-angular.decorator.log'));

    beforeEach(inject(function (_$log_, _$window_) {
      $log = _$log_;

      $window = _$window_;
      $window.newrelic = {
        noticeError: jasmine.createSpy('noticeError')
      };
    }));

    describe('when window.newrelic is not defined', function () {
      beforeEach(function () {
        delete $window.newrelic;
      })
      it('should call $log.warn', function () {
        $log.error(errorMessage);
        expect($log.warn.logs.length).toBe(1);
      });
    });

    it('should call noticeError when $log.error called with exception', function () {
      $log.error(new Error(errorMessage));
      expect($window.newrelic.noticeError).toHaveBeenCalled();
    });

    it('should call noticeError with an exception/stacktrace when $log.error called with string', function () {
      $log.error(errorMessage);
      expect($window.newrelic.noticeError.calls.mostRecent().args[0] instanceof Error).toBeTruthy();
    });

    it('should call noticeError for each argument of $log.error', function () {
      $log.error(errorMessage, errorMessage);
      expect($window.newrelic.noticeError.calls.count()).toBe(2);
    })
  });

})();
