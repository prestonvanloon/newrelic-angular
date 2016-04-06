  'use strict';
  
  angular.module('newrelic-angular', [
    'angulartics',
    'angulartics.newrelic.insights',
    'newrelic-angular.decorator.log',
    'newrelic-angular.interceptor.http'
  ]);

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
            
            for (var i = 0, len = arguments.length, arg; i < len; i++) {
              arg = arguments[i];
              if (arg instanceof Error === false) {
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

  'use strict';
  (function(angular) {

    angular.module('newrelic-angular.interceptor.http', [])
      .provider('httpInterceptor', HttpInterceptorProvider)
      .config(HttpInterceptorConfig);

    /**
     * Http Interceptor
     * Intercepts HTTP response and request errors and logs them to new relic
     * @param {Promise} $q
     * @param {Object} $log
     * @return Object
     */

    function HttpInterceptorProvider() {

      var statusesToIgnore = [];

      this.setStatusesToIgnore = setStatusesToIgnore;

      function setStatusesToIgnore(statuses) {
        statusesToIgnore = statuses || [];
      }

      function shouldIgnoreStatus(status) {
        return status && isFinite(status) && statusesToIgnore.indexOf(status) > -1;
      }

      function HttpInterceptorFactory($q, $log) {

        // Intercept request and response errors
        return {
          requestError: logAndReturnError.bind(null, 'request'),
          responseError: logAndReturnError.bind(null, 'response')
        };

        /**
        * Log and and reject promise
        * @param {String} httpType response or request
        * @param {Object} rejection contains $http parameter configuration values
        * @return {Promise} promise
        */
        function logAndReturnError(httpType, rejection) {
          var config = rejection.config || {};

          if ( ! shouldIgnoreStatus(rejection.status) ) {
            var err = 'bad ' + config.method + ' ' + httpType + ' ' + rejection.config.url;
            $log.error(new Error(err));
          }
          return $q.reject(rejection);
        }
      }

      this.$get = ['$q', '$log', HttpInterceptorFactory];

    }

    /**
     * Intercept any Http response or request errors
     *   and log them to new relic
     */
    HttpInterceptorConfig.$inject = ['$httpProvider'];
    function HttpInterceptorConfig($httpProvider) {
      $httpProvider.interceptors.push('httpInterceptor');
    }

  }(window.angular));
