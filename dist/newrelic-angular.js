  'use strict';
  
  angular.module('newrelic-angular', [
    'angulartics',
    'angulartics.newrelic.insights',
    'newrelic-angular.decorator.log',
    'newrelic-angular.interceptor.http'
  ]);

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
        status = +status;
        return status && statusesToIgnore.indexOf(status) > -1;
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

/**
 * @license Angulartics v0.17.2
 * (c) 2013 Luis Farzati http://luisfarzati.github.io/angulartics
 * License: MIT
 */
(function(angular, analytics) {
'use strict';

var angulartics = window.angulartics || (window.angulartics = {});
angulartics.waitForVendorCount = 0;
angulartics.waitForVendorApi = function (objectName, delay, containsField, registerFn, onTimeout) {
  if (!onTimeout) { angulartics.waitForVendorCount++; }
  if (!registerFn) { registerFn = containsField; containsField = undefined; }
  if (!Object.prototype.hasOwnProperty.call(window, objectName) || (containsField !== undefined && window[objectName][containsField] === undefined)) {
    setTimeout(function () { angulartics.waitForVendorApi(objectName, delay, containsField, registerFn, true); }, delay);
  }
  else {
    angulartics.waitForVendorCount--;
    registerFn(window[objectName]);
  }
};

/**
 * @ngdoc overview
 * @name angulartics
 */
angular.module('angulartics', [])
.provider('$analytics', function () {
  var settings = {
    pageTracking: {
      autoTrackFirstPage: true,
      autoTrackVirtualPages: true,
      trackRelativePath: false,
      autoBasePath: false,
      basePath: ''
    },
    eventTracking: {},
    bufferFlushDelay: 1000, // Support only one configuration for buffer flush delay to simplify buffering
    developerMode: false // Prevent sending data in local/development environment
  };

  // List of known handlers that plugins can register themselves for
  var knownHandlers = [
    'pageTrack',
    'eventTrack',
    'setAlias',
    'setUsername',
    'setUserProperties',
    'setUserPropertiesOnce',
    'setSuperProperties',
    'setSuperPropertiesOnce'
  ];
  // Cache and handler properties will match values in 'knownHandlers' as the buffering functons are installed.
  var cache = {};
  var handlers = {};

  // General buffering handler
  var bufferedHandler = function(handlerName){
    return function(){
      if(angulartics.waitForVendorCount){
        if(!cache[handlerName]){ cache[handlerName] = []; }
        cache[handlerName].push(arguments);
      }
    };
  };

  // As handlers are installed by plugins, they get pushed into a list and invoked in order.
  var updateHandlers = function(handlerName, fn){
    if(!handlers[handlerName]){
      handlers[handlerName] = [];
    }
    handlers[handlerName].push(fn);
    return function(){
      var handlerArgs = arguments;
      angular.forEach(handlers[handlerName], function(handler){
        handler.apply(this, handlerArgs);
      }, this);
    };
  };

  // The api (returned by this provider) gets populated with handlers below.
  var api = {
    settings: settings
  };

  // Will run setTimeout if delay is > 0
  // Runs immediately if no delay to make sure cache/buffer is flushed before anything else.
  // Plugins should take care to register handlers by order of precedence.
  var onTimeout = function(fn, delay){
    if(delay){
      setTimeout(fn, delay);
    } else {
      fn();
    }
  };

  var provider = {
    $get: function() { return api; },
    api: api,
    settings: settings,
    virtualPageviews: function (value) { this.settings.pageTracking.autoTrackVirtualPages = value; },
    firstPageview: function (value) { this.settings.pageTracking.autoTrackFirstPage = value; },
    withBase: function (value) {
      this.settings.pageTracking.basePath = (value) ? angular.element(document).find('base').attr('href') : '';
    },
    withAutoBase: function (value) { this.settings.pageTracking.autoBasePath = value; },
    developerMode: function(value) { this.settings.developerMode = value; }
  };

  // General function to register plugin handlers. Flushes buffers immediately upon registration according to the specified delay.
  var register = function(handlerName, fn){
    api[handlerName] = updateHandlers(handlerName, fn);
    var handlerSettings = settings[handlerName];
    var handlerDelay = (handlerSettings) ? handlerSettings.bufferFlushDelay : null;
    var delay = (handlerDelay !== null) ? handlerDelay : settings.bufferFlushDelay;
    angular.forEach(cache[handlerName], function (args, index) {
      onTimeout(function () { fn.apply(this, args); }, index * delay);
    });
  };

  var capitalize = function (input) {
      return input.replace(/^./, function (match) {
          return match.toUpperCase();
      });
  };

  // Adds to the provider a 'register#{handlerName}' function that manages multiple plugins and buffer flushing.
  var installHandlerRegisterFunction = function(handlerName){
    var registerName = 'register'+capitalize(handlerName);
    provider[registerName] = function(fn){
      register(handlerName, fn);
    };
    api[handlerName] = updateHandlers(handlerName, bufferedHandler(handlerName));
  };

  // Set up register functions for each known handler
  angular.forEach(knownHandlers, installHandlerRegisterFunction);
  return provider;
})

.run(['$rootScope', '$window', '$analytics', '$injector', function ($rootScope, $window, $analytics, $injector) {
  if ($analytics.settings.pageTracking.autoTrackFirstPage) {
    $injector.invoke(['$location', function ($location) {
      /* Only track the 'first page' if there are no routes or states on the page */
      var noRoutesOrStates = true;
      if ($injector.has('$route')) {
         var $route = $injector.get('$route');
         for (var route in $route.routes) {
           noRoutesOrStates = false;
           break;
         }
      } else if ($injector.has('$state')) {
        var $state = $injector.get('$state');
        for (var state in $state.get()) {
          noRoutesOrStates = false;
          break;
        }
      }
      if (noRoutesOrStates) {
        if ($analytics.settings.pageTracking.autoBasePath) {
          $analytics.settings.pageTracking.basePath = $window.location.pathname;
        }
        if ($analytics.settings.pageTracking.trackRelativePath) {
          var url = $analytics.settings.pageTracking.basePath + $location.url();
          $analytics.pageTrack(url, $location);
        } else {
          $analytics.pageTrack($location.absUrl(), $location);
        }
      }
    }]);
  }

  if ($analytics.settings.pageTracking.autoTrackVirtualPages) {
    $injector.invoke(['$location', function ($location) {
      if ($analytics.settings.pageTracking.autoBasePath) {
        /* Add the full route to the base. */
        $analytics.settings.pageTracking.basePath = $window.location.pathname + "#";
      }
      if ($injector.has('$route')) {
        $rootScope.$on('$routeChangeSuccess', function (event, current) {
          if (current && (current.$$route||current).redirectTo) return;
          var url = $analytics.settings.pageTracking.basePath + $location.url();
          $analytics.pageTrack(url, $location);
        });
      }
      if ($injector.has('$state')) {
        $rootScope.$on('$stateChangeSuccess', function (event, current) {
          var url = $analytics.settings.pageTracking.basePath + $location.url();
          $analytics.pageTrack(url, $location);
        });
      }
    }]);
  }
  if ($analytics.settings.developerMode) {
    angular.forEach($analytics, function(attr, name) {
      if (typeof attr === 'function') {
        $analytics[name] = function(){};
      }
    });
  }
}])

.directive('analyticsOn', ['$analytics', function ($analytics) {
  function isCommand(element) {
    return ['a:','button:','button:button','button:submit','input:button','input:submit'].indexOf(
      element.tagName.toLowerCase()+':'+(element.type||'')) >= 0;
  }

  function inferEventType(element) {
    if (isCommand(element)) return 'click';
    return 'click';
  }

  function inferEventName(element) {
    if (isCommand(element)) return element.innerText || element.value;
    return element.id || element.name || element.tagName;
  }

  function isProperty(name) {
    return name.substr(0, 9) === 'analytics' && ['On', 'Event', 'If', 'Properties', 'EventType'].indexOf(name.substr(9)) === -1;
  }

  function propertyName(name) {
    var s = name.slice(9); // slice off the 'analytics' prefix
    if (typeof s !== 'undefined' && s!==null && s.length > 0) {
      return s.substring(0, 1).toLowerCase() + s.substring(1);
    }
    else {
      return s;
    }
  }

  return {
    restrict: 'A',
    link: function ($scope, $element, $attrs) {
      var eventType = $attrs.analyticsOn || inferEventType($element[0]);
      var trackingData = {};

      angular.forEach($attrs.$attr, function(attr, name) {
        if (isProperty(name)) {
          trackingData[propertyName(name)] = $attrs[name];
          $attrs.$observe(name, function(value){
            trackingData[propertyName(name)] = value;
          });
        }
      });

      angular.element($element[0]).bind(eventType, function ($event) {
        var eventName = $attrs.analyticsEvent || inferEventName($element[0]);
        trackingData.eventType = $event.type;

        if($attrs.analyticsIf){
          if(! $scope.$eval($attrs.analyticsIf)){
            return; // Cancel this event if we don't pass the analytics-if condition
          }
        }
        // Allow components to pass through an expression that gets merged on to the event properties
        // eg. analytics-properites='myComponentScope.someConfigExpression.$analyticsProperties'
        if($attrs.analyticsProperties){
          angular.extend(trackingData, $scope.$eval($attrs.analyticsProperties));
        }
        $analytics.eventTrack(eventName, trackingData);
      });
    }
  };
}]);
})(angular);

/**
 * @license Angulartics v0.17.2
 * (c) 2013 Luis Farzati http://luisfarzati.github.io/angulartics
 * Contributed by Jakub Hampl http://gampleman.eu
 * License: MIT
 */
(function(angular) {
'use strict';

/**
 * @ngdoc overview
 * @name angulartics.newrelic.insights
 * Enables analytics support for New Relic Insights
 */
angular.module('angulartics.newrelic.insights', ['angulartics'])
.config(['$analyticsProvider', function ($analyticsProvider) {
  angulartics.waitForVendorApi('newrelic', 100, function(newrelic) {
    $analyticsProvider.registerEventTrack(function(action, properties) {
      newrelic.addPageAction(action, properties);
    });
    $analyticsProvider.registerSetUsername(function(name) {
      newrelic.setCustomAttribute('username', name);
    });
    $analyticsProvider.registerSetAlias(function(name) {
      newrelic.setCustomAttribute('alias', name);
    });
    $analyticsProvider.registerSetUserProperties(function(properties) {
      angular.forEach(properties, function(value, key) {
        newrelic.setCustomAttribute(key, value);
      });
    });
  });
}]);
})(angular);
