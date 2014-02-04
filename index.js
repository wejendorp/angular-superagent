// Convenience service to wrap Superagent with defaults and promises
//
angular.module('ng-superagent')
.provider('Request', function() {
  var agent = window.superagent;

  var options = {
    baseUrl:    '',
    timeout:    10000,
    headers:    {},
    promises:   [],
    transforms: []
  };

  // Hack to make angular aware of this pending request. Useful for protractor tests.
  var p;
  function startRequest() {
    p = $timeout(function(){
      throw new Error('Request timed out after '+options.timeout+' ms');
    }, options.timeout);
  }
  function endRequest() {
    $timeout.cancel(p); // angular no longer has pending req.
  }

  return {
    '$get' : function($q, $timeout, $log) {
      // Promisify this thing!
      agent.Request.prototype._end = agent.Request.prototype.end;
      agent.Request.prototype.end = function(fn) {

        try {
          startRequest();
          this._end(function(err, res) {
            endRequest();

            function next() {
              var args, transform = options.transforms.shift();
              if(!transform) return fn(err, res);

              args = Array.prototype.slice.call(arguments);
              transform.apply({}, args.push(next));
            }

            next(err, res);
          });
        } catch (e) {
          $log.debug(e);
          fn(e);
        }
      };

      agent.Request.prototype.promise = function() {
        var deferred = $q.defer();

        startRequest();
        deferred.promise.finally(endRequest);


        this.end(function(err, res) {
          if (err || !res.ok) {
            if(err) {
              $log.debug(err);
            }
            return deferred.reject(res || {});
          }
          return deferred.resolve(res);
        });


        var chain = deferred.promise;
        // Make this.reject / this.resolve possible since angular returns a new promise for each then
        var methods = {
          reject: $q.reject,
          resolve: $q.when
        };

        // Wrap in helper to ignore non-returning handlers
        var wrap = function(fn) {
          return function(val) {
            var res = fn(val);
            if(typeof res === 'undefined') {
              return val;
            }
            return res;
          };
        };

        options.promises.forEach(function(fns) {
          var success = fns[0] ? wrap(fns[0].bind(methods)) : null;
          var error   = fns[1] ? wrap(fns[1].bind(methods)) : null;
          chain = chain.then(success, error);
        });
        return chain;
      };


      // Configure request defaults
      var methods = ['get', 'head', 'del', 'put', 'post', 'patch'];
      methods.forEach(function(m) {
        if(agent['_'+m]) return;
        agent['_'+m] = agent[m];
        agent[m] = function() {
          var args = Array.prototype.slice.call(arguments);
          args[0] = options.baseUrl + args[0]; // url
          var method = agent['_'+m].apply({}, args);
          if(options.credentials) method.withCredentials();
          if(options.headers) method.set(options.headers);
          return method;
        };
      });

      return agent;
    },
    setHeaders : function(headers) {
      options.headers = _.extend(options.headers, headers);
      return this;
    },
    withCredentials : function() {
      options.credentials = true;
      return this;
    },
    baseUrl: function(url) {
      options.baseUrl = url;
      return this;
    },
    timeout: function(timeout) {
      options.timeout = timeout;
      return this;
    },
    transform: function(fn) {
      options.transforms.push(fn);
      return this;
    },
    then: function(success, error) {
      options.promises.push([success, error]);
      return this;
    }
  };
});
