  'use strict';
  
  angular.module('newrelic-angular', [
    'angulartics',
    'angulartics.newrelic.insights',
    'newrelic-angular.decorator.log',
    'newrelic-angular.interceptor.http'
  ]);
