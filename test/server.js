
var slugs = (process.env.tests || '').split(/ *, */);
var express = require('express');
var serve = express.static(__dirname + '/..');
var fs = require('fs');
var hbs = require('hbs');
var path = require('path');


/**
 * App.
 */

var app = express()
  .use(send)
  .set('views', __dirname)
  .engine('html', hbs.__express)
  .get('/coverage', function(_, res){
    res.render('coverage.html');
  })
  .get('/', function (req, res, next) {
    res.render('index.html');
  })
  .get('/error', function(req, res) {
    res.send(500);
  })
  .get('/test/error', function(req, res) {
    res.json({status: 'error'});
  })
  .all('/test/*', function(req, res) {
    res.json({status: 'ok'});
  })
  .listen(4334, function () {
    fs.writeFileSync(__dirname + '/pid.txt', process.pid, 'utf-8');
    console.log('Started testing server on port 4334...');
  });

function send(req, res, next){
  var test = 0 == req.url.indexOf('/test/integrations');
  var slug = req.url.split('/').pop().slice(0, -3);
  if (!test) return serve(req, res, next);
  if ('*' == slugs[0]) return serve(req, res, next);
  if (~slugs.indexOf(slug)) return serve(req, res, next);
  res.type('text/javascript');
  res.send(';');
}
