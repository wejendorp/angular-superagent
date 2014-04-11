require('angular-superagent');

var assert = require('assert');

describe('Request', function() {
  var RequestProvider;

  beforeEach(module('ngSuperagent'));
  beforeEach(module(function(_RequestProvider_) {
    RequestProvider = _RequestProvider_;
  }));
  beforeEach(inject(function() {}));

  var server;
  var methods = ['get', 'head', 'del', 'put', 'post', 'patch'];

  before(function () {
    server = sinon.fakeServer.create();
    server.fakeHTTPMethods = true;
  });
  after(function () { server.restore(); });

  beforeEach(function() {
    methods.forEach(function(m) {
      respond(m.toUpperCase(), '/api/v2', 200, {status: 'ok'});
    });
    function respond(method, path, status, body) {
      server.respondWith(method, path, JSON.stringify(body));
    }
  });


  it('should expose RequestProvider', function() {
    assert(RequestProvider);
  });
  it('should expose Request service', function() {
    inject(function(Request) {
      assert(Request !== null);
    });
  });

  describe('when unconfigured', function() {
    it('has correct defaults', function() {
      assert(RequestProvider.defaults.baseUrl === '');
    });
  });


  describe('when given a baseUrl', function() {
    beforeEach(function() {
      RequestProvider.defaults.baseUrl = '/api/v2';
    });
    beforeEach(inject(function(_Request_) {
      Request = _Request_;
    }));

    methods.forEach(function(m) {
      it('#'+m + ' is redirected to the api', function() {
        var cb = sinon.spy();
        Request[m]('').end(cb);
        server.respond();
        sinon.assert.calledOnce(cb);
        sinon.assert.calledWithMatch(cb, null, {body: {status: 'ok'}});
      });
    });
  });


  // describe('#promise', function() {
  //   var cb;
  //   function validate() {
  //     server.respond();
  //     sinon.assert.calledOnce(cb);
  //   }
  //   beforeEach(function() {
  //     cb = sinon.spy();
  //   });

  //   it('is a $q promise', function() {
  //     var p = Request.get('/ping').promise();
  //     expect(p.then).to.be.a('function');
  //     expect(p.catch).to.be.a('function');
  //     expect(p.finally).to.be.a('function');

  //     p.finally(cb);
  //     validate();
  //   });
  //   it('is resolved on HTTP 200 ok', function() {
  //     Request.get('/ping').promise().then(cb);
  //     validate();
  //   });
  //   it('is rejected on HTTP 404', function() {
  //     Request.get('/notfound').promise().catch(cb);
  //     validate();
  //   });
  //   it('is rejected on body.status !== "ok"', function() {
  //     Request.get('/error').promise().catch(cb);
  //     validate();
  //   });
  //   it('resolves promise with body.data', function() {
  //     Request.get('/data').promise().then(cb);
  //     // function(res) {
  //     //   // console.log(res.success);
  //     // });
  //     // server.respond();
  //     validate();
  //     cb.should.have.been.calledWithMatch(testData);
  //   });
  // });
});
