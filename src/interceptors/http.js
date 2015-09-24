(function (angular) {
  	'use strict';
	
	angular.module('newrelic-angular.interceptor.http', []).factory('httpInterceptor', HttpInterceptorFactory)
    .config(HttpInterceptorConfig)
  ;
	
  /**
   * Http Interceptor
   * Intercepts HTTP response and request errors and logs them to new relic
   */
  HttpInterceptorFactory.$inject = ['$q', '$log'];
  function HttpInterceptorFactory($q, $log) {

    // Intercept request and response errors
    return {
      requestError: logAndReturnError.bind(null, 'request'),
      responseError: logAndReturnError.bind(null, 'response')
    };

    /**
     * Log and return rejection promise
     */
    function logAndReturnError(httpType, rejection) {
      var config = rejection.config || {};
      var err = 'bad ' + config.method + ' ' + httpType + ' ' + rejection.config.url;
      $log.error(new Error(err));
      return $q.reject(rejection);
    }

  }
	
  /**
   * Intercept any Http response or request errors
   *   and log them to new relic
   */
  HttpInterceptorConfig.$inject = ['$httpProvider'];
  function HttpInterceptorConfig($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
  }
	
	

})(window.angular);
