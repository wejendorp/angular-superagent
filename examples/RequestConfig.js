angular.module('ng-superagent')
.config(['RequestProvider', function(RequestProvider) {
  RequestProvider
    .baseUrl('http://localhost:3000')
    .withCredentials()
    .setHeaders({'Authentication': 'Token cookiemonster'})
    .timeout(2500)
    .transform(function(err, res, next) {
      next(err, res);
    })
    .then(function(res) {

    }, function(err) {

    });
}]);