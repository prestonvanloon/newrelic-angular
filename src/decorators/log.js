  'use strict';
  /*
  * Angular exceptionHandler delegates unhandled exceptions to $log.error
  * This module reports errors to New Relic Browser API
  */
  (function(angular) {
    angular.module('newrelic-angular.decorator.log', [])
      .config(logDecorator);
  
    logDecorator.$inject = ['$provide'];
  
    function logDecorator($provide) {
      $provide.decorator('$log', extendLog);
    }
  
    extendLog.$inject = ['$delegate', '$window'];
  
    function extendLog($delegate, $window) {
      $delegate.error = decorateErrorFunction($delegate.error);
      
      return $delegate;
  
      function decorateErrorFunction(originalFn) {
        
        var fn = function() {
  
          if (angular.isDefined($window.newrelic)) {
            for (var arg in Array.prototype.slice.call(arguments)) {
              if (arguments[arg] instanceof Error === false) {
                arg = argToErrorObject(arg);
              }
              $window.newrelic.noticeError(arg); // Report to NR
            }
          } else {
            $delegate.warn('Could not report error to New Relic because the global New Relic module is missing!');
          }
          originalFn.apply(null, arguments);
        };
        
        fn.logs = []; // Restore logs
        
        return fn;
      }
    }
    
    function argToErrorObject(arg) {
      try {
        throw new Error(arg);
      } catch (e) {
        return e;
      }
    }
  
  }(window.angular));
