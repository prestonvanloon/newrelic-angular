  'use strict';
  
  (function() {
    
    describe('$http interceptor ', function() {
      
      var $log;
      var $window;
      var httpInterceptor;
      
      var errorRequest = {
        status: 500, 
        config: {
          url: '/testResponse'
        }
      };
      
      var unauthorizedRequest = {
        status: 401, 
        config: {
          url: '/testRequest'
        }
      };
      
      var statusesToIgnore = [400, 401, 403, 404, 419];
      
      beforeEach(module('newrelic-angular.interceptor.http'));
      
      describe('when using default provider', function(){
        
        beforeEach(inject(function(_$log_, _$window_, _httpInterceptor_) {
           $log = _$log_;
          $window = _$window_;
          httpInterceptor = _httpInterceptor_;
        }));
      
        it('should call noticeError when httpInterceptor responseError is called', function() {
          httpInterceptor.responseError( errorRequest );
          expect($log.error.logs.length).toBe(1);
        });
        
        it('should call noticeError when httpInterceptor requestError is called', function() {
          httpInterceptor.requestError( unauthorizedRequest );
          expect($log.error.logs.length).toBe(1);
        });
        
        it('Should not ignore 400, 401, 403, 404, 419 statuses', function(){
          statusesToIgnore.forEach(function(status){
            unauthorizedRequest.status = status;
            httpInterceptor.responseError( unauthorizedRequest );
          });
          expect($log.error.logs.length).toBe(statusesToIgnore.length);
        });
        
      });
      
      describe('when setting provider statusToIgnore list', function(){
        
        beforeEach(module(function(httpInterceptorProvider){
          httpInterceptorProvider.setStatusesToIgnore(statusesToIgnore);
        }));
        
        beforeEach(inject(function(_$log_, _$window_, _httpInterceptor_) {
          $log = _$log_;
          $window = _$window_;
          httpInterceptor = _httpInterceptor_;
        }));
        
        it('Should ignore 400, 401, 403, 404, 419 statuses', function(){
          statusesToIgnore.forEach(function(status){
            unauthorizedRequest.status = status;
            httpInterceptor.responseError( unauthorizedRequest );
          });
          expect($log.error.logs.length).toBe(0);
        });
        
        it('Should log a 500 message', function(){
          httpInterceptor.responseError( errorRequest );
            expect($log.error.logs.length).toBe(1);
        });
      });
      
    });
  
  }());
