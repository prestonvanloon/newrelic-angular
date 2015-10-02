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
        return isFinite(status) && statusesToIgnore.indexOf(status) > -1;
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
