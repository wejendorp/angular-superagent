angular.module('ng-superagent')
.config(['RequestProvider', function(RequestProvider) {
  RequestProvider.defaults = {
    baseUrl: '',
    timeout: 10000,
    headers: {},
    credentials: true
  };
  RequestProvider.addResolver(function(res) {
    if(res.body)
  })

}]);
