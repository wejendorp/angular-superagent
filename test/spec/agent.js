require('angular-superagent');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

describe('Request', function() {
  var RequestProvider;

  // Initialize module
  beforeEach(module('ngSuperagent'));

  var methods = ['get', 'head', 'del', 'put', 'post', 'patch'];


  describe('when unconfigured', function() {
    // Module config step
    beforeEach(angular.mock.module(function(_RequestProvider_) {
      RequestProvider = _RequestProvider_;
    }));
    // Module run step
    beforeEach(angular.mock.inject(function(_Request_) {
      Request = _Request_;
    }));

    it('has correct defaults', function() {
      assert(!RequestProvider.defaults.baseUrl);
    });
    it('should expose RequestProvider', function() {
      assert(RequestProvider);
    });
    it('should expose Request service', function() {
      assert(Request !== null);
    });
  });


  describe('when given a baseUrl', function() {
    // Module config step
    beforeEach(angular.mock.module(function(RequestProvider) {
      RequestProvider.defaults.baseUrl = '/test';
    }));
    // Module run step
    beforeEach(angular.mock.inject(function(_Request_) {
      Request = _Request_;
    }));

    it('all methods redirected to the api', function(done) {
      methods.forEach(function(m) {
        var cb = sinon.spy();
        Request[m]('/random').end(function(err, res) {
          assert(!err);
          expect(res.status).to.eql(200);
          done();
        });
      });
    });
  });


  describe('#promise', function() {
    var cb;

    it('is a $q promise', function() {
      var p = Request.get('/ping').promise();
      expect(p.then).to.be.a('function');
      expect(p.catch).to.be.a('function');
      expect(p.finally).to.be.a('function');
    });
    describe('#addResolve', function() {
      // Module config step
      beforeEach(angular.mock.module(function(RequestProvider) {
        RequestProvider.addResolver(function(res) {
          if(res.error || !res.body) return this.reject(res);
          if(res.body.status === 'ok') return this.resolve(res);
          return this.reject(res);
        });
      }));
      // Module run step
      beforeEach(angular.mock.inject(function(_Request_) {
        Request = _Request_;
      }));
      it('is resolved on HTTP 200 ok', function(done) {
        Request.get('/test/ping').promise().then(function(res) {
          expect(res.status).to.eql(200);
          done();
        });
      });
      it('is rejected on HTTP 404', function(done) {
        Request.get('/notfound').promise().catch(function(res) {
          expect(res.status).to.eql(404);
          done();
        });
      });
      it('is rejected on HTTP 500', function(done) {
        Request.get('/error').promise().catch(function() {
          done();
        });
      });
      it('is rejected on body.status !== "ok"', function(done) {
        Request.get('/test/error').promise().catch(function(res) {
          expect(res.body).not.to.eql({status: 'ok'});
          done();
        });
      });
      it('is rejected on CORS error', function(done) {
        Request.get('http://mojn.com').promise().then(function() {
          done(new Error('Not rejected'));
        }, function() {
          done();
        });
      });
    });
  });
});
