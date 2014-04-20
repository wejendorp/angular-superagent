angular.module('ng-superagent')
.config(['RequestProvider', function(RequestProvider) {

  angular.extend(RequestProvider.defaults, {
    baseUrl: 'http://localhost:3000',
    timeout: 10000,
    headers: {},
    credentials: true
  });

  RequestProvider.addResolver(function(res) {
    // Only run if  err === null
    // We want to fail the request if the body does not match either
    if(!res.body || res.body.status !== 'ok') {
      // use this.reject to return a rejected promise
      return this.reject(res);
    }
    // use normal return to resolve this promise to the return value
    return res.body.data;
  }, function(err) {
    // Superagent error, e.g. timeout or CORS error
    console.log(err);
    // remember to re-reject the promise, otherwise it will be implicitly
    // recovered and be handled by your success handlers below.
    return this.reject(err);
  });

}]).run(function(Request) {

  Request.get('/api/status').promise()
    .then(function(data) {
      // Promise now resolves to the {data: ...} part of the response body
    }, function(err) {
      // and responses that violate status check end up here
    });

});
