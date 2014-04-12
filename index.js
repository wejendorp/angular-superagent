angular.module('ngSuperagent', ['ng'])
.provider('Request', function() {
  var agent   = require('superagent');
  var Emitter = require('emitter');

  var $q, $timeout, $log, $scope;
  Emitter(agent);

  var requestProvider = {};
  requestProvider.defaults = {
    baseUrl: '',
    headers: {},
    credentials: true,
    timeout: 10000
  };
  // Request transformations
  requestProvider.transforms = [];
  requestProvider.resolvers = [];

  requestProvider.$get = function getService(_$q_, _$timeout_, _$log_, _$rootScope_) {
    $q = _$q_;
    $timeout = _$timeout_;
    $log = _$log_;
    $scope = _$rootScope_;

    requestProvider.transform('set', requestProvider.defaults.headers);
    requestProvider.transform('withCredentials', null, requestProvider.defaults.credentials);
    requestProvider.transform('timeout', requestProvider.defaults.timeout);

    var methods = ['get', 'head', 'del', 'put', 'post', 'patch'];
    methods.forEach(function(m) {
      agent['_'+m] = agent['_'+m] || agent[m];
      agent[m] = function() {
        var timer;
        // Prepend defaults.baseUrl to all requests:
        var args = Array.prototype.slice.call(arguments);
        args[0] = requestProvider.defaults.baseUrl + args[0];
        var request = agent['_'+m].apply({}, args);

        applyTransforms(request);


        // Make angular aware of requests
        request.on('request', startRequest);
        request.on('end',   endRequest);
        request.on('abort', endRequest);
        request.on('error', endRequest);

        function startRequest() {
          timer = $timeout(function timeout() {
            deferred.reject(new Error('Request timed out'));
            timer = null;
          }, requestProvider.defaults.timeout);
        }
        function endRequest() {
          $timeout.cancel(timer);
        }

        // Make events available in provider
        request.on('request', providerEmit('request'));
        request.on('error', providerEmit('error'));
        request.on('abort', providerEmit('abort'));
        request.on('end', providerEmit('end'));

        return request;
      };
      // Add promise method to requests
      agent.Request.prototype.promise = function() {
        var deferred = $q.defer();
        var methods = {
          reject: $q.reject,
          resolve: $q.when
        };

        this.end(function(err, res) {
          if(err) {
            agent.emit('error', err);
            err = $q.reject(err);
          }

          var resolution = requestProvider.resolvers.reduce(function(promise, resolvers) {
            var success = resolvers[0] ? resolvers[0].bind(methods) : null;
            var error   = resolvers[1] ? resolvers[1].bind(methods) : null;
            return promise.then(success, error);
          }, err || $q.when(res));

          //
          agent.emit('end', this);
          deferred.resolve(resolution);
          $scope.$apply();
        });


        return deferred.promise;
      };
      agent.Request.prototype._end = agent.Request.prototype._end || agent.Request.prototype.end;
      agent.Request.prototype.end = function() {
        var args = Array.prototype.slice.call(arguments);
        var request = this._end.apply(this, args);
        agent.emit('request');
      };
    });

    return agent;
  };
  function providerEmit(type) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.call(args, type);
      agent.emit.apply(agent, args);
    };
  }
  function applyTransforms(req) {
    requestProvider.transforms.forEach(function(transformer) {
      if(typeof transformer.condition !== 'undefined' &&
         !transformer.condition) return;
      req[transformer.fn].call(req, transformer.params);
    });
  }
  requestProvider.transform = function (type, params, condition) {
    requestProvider.transforms.push({
      fn:     type,
      params: params
    });
  };

  // Promise specific
  //
  // Chaining
  requestProvider.addResolver = function(success, error) {
    requestProvider.resolvers.push([success, error]);
  };


  return requestProvider;
});
