angular.module('ngSuperagent', ['ng'])
.provider('Request', function() {
  var agent   = require('superagent');
  var Emitter = require('emitter');

  var $q, $timeout, $log;
  Emitter.call(agent);

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

  requestProvider.$get = function getService(_$q_, _$timeout_, _$log_) {
    $q = _$q_;
    $timeout = _$timeout_;
    $log = _$log_;

    requestProvider.transform('set', requestProvider.defaults.headers);
    requestProvider.transform('withCredentials', null, requestProvider.defaults.credentials);
    requestProvider.transform('timeout', requestProvider.defaults.timeout);

    var methods = ['get', 'head', 'del', 'put', 'post', 'patch'];
    methods.forEach(function(m) {
      if(agent['_'+m]) return;
      agent['_'+m] = agent[m];
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
        request.on('request', providerEmit(request, 'request'));
        request.on('error', providerEmit(request, 'error'));
        request.on('abort', providerEmit(request, 'abort'));
        request.on('end', providerEmit(request, 'end'));

        return request;
      };
    });

    return agent;
  };
  function providerEmit(ctx, type) {
    return function() {
      agent.emit.apply(ctx, Array.prototype.unshift.call(arguments, type));
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

  // Add promise method to requests
  agent.Request.prototype.promise = function() {
    var deferred = $q.defer();
    var methods = {
      reject: $q.reject,
      resolve: $q.when
    };

    this.end(function(err, res) {
      var resolution = requestProvider.resolvers.reduce(function(promise, resolvers) {
        var success = resolvers[0] ? resolvers[0].bind(methods) : null;
        var error   = resolvers[1] ? resolvers[1].bind(methods) : null;
        return promise.then(success, error);
      }, $q.when([err, res]));

      return deferred.resolve(resolution);
    });

    return deferred.promise;
  };
  // Register default resolution. Only superagent errors are rejected.
  requestProvider.addResolver(function(args) {
    var err = args[0];
    var res = args[1];
    if(err) return this.reject(err);
    this.resolve(res);
  });


  return requestProvider;
});
