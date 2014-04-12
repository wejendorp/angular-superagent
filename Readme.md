# angular-superagent

  Angular wrapper for [Superagent](https://github.com/visionmedia/superagent).

  Written because the [Restangular](https://github.com/mgonto/restangular) api never made sense to me,
  and superagent has a nicer api than [$http](http://docs.angularjs.org/api/ng.$http) or jQuery.

## Installation

  Install with [component(1)](http://component.io):

    $ component install wejendorp/angular-superagent

    $ bower install angular-superagent

## API
The `Request` service works just like [superagent](https://github.com/visionmedia/superagent),
except extended with promises and defaults via `RequestProvider.defaults`.

The request can be written as default superagent, e.g.
```js
app.controller('AppCtrl', function(Request) {
  Request.get('/data')
    .query({page: 1})
    .promise();
})
```

### request#promise()
Like `request#end`, but returns a promise instead of taking a callback.
Returns a [$q](http://docs.angularjs.org/api/ng.$q) promise, that is resolved with the superagent response object.

### request#end(fn)
The classic superagent request end, but with configured defaults


## Configure: RequestProvider
### defaults
To set new defaults just override the options here:
```js
RequestProvider.defaults = {
  baseUrl: '',
  headers: {},
  credentials: true,
  timeout: 10000
};
```

### #addResolver(success, error)
Extends the promise chain returned from `request#promise()`,
useful for conditional transformations.

`success` and `error` are executed with `this` bound to expose `this.reject` and `this.resolve`
functions, enabling each promise to either resolve or reject itself.



## License

  The MIT License (MIT)

  Copyright (c) 2014 Jacob Wejendorp <jacob@wejendorp.dk>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
