  'use strict';
  
  (function() {
    
    describe('$http interceptor ', function() {
      
      var $log;
      var $window;
      var httpInterceptor;
      
      var responseRejection = {
        status: '500', 
        config: {
          url: '/testResponse'
        }
      };
      
      var requestRejection = {
        status: '401', 
        config: {
          url: '/testRequest'
        }
      };
      
      beforeEach(module('newrelic-angular.interceptor.http'));
      
      beforeEach(inject(function(_$log_, _$window_, _httpInterceptor_) {
        $log = _$log_;
        $window = _$window_;
        httpInterceptor = _httpInterceptor_;
      }));
  
      it('should call noticeError when httpInterceptor responseError is called', function() {
        httpInterceptor.responseError( responseRejection );
        expect($log.error.logs.length).toBe(1);
      });
      
      it('should call noticeError when httpInterceptor requestError is called', function() {
        httpInterceptor.requestError( requestRejection );
        expect($log.error.logs.length).toBe(1);
      });
      
    });
  
  }());
