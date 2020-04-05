# trouter-paths

[![NPM version](https://badge.fury.io/js/trouter-paths.png)](http://badge.fury.io/js/trouter-paths)
[![Build Status](https://badgen.now.sh/travis/prantlf/trouter-paths)](https://travis-ci.org/prantlf/trouter-paths)
[![codecov](https://codecov.io/gh/prantlf/trouter-paths/branch/master/graph/badge.svg)](https://codecov.io/gh/prantlf/trouter-paths)
[![Dependency Status](https://david-dm.org/prantlf/trouter-paths.svg)](https://david-dm.org/prantlf/trouter-paths)
[![devDependency Status](https://david-dm.org/prantlf/trouter-paths/dev-status.svg)](https://david-dm.org/prantlf/trouter-paths#info=devDependencies)

[![NPM Downloads](https://nodei.co/npm/trouter-paths.png?downloads=true&stars=true)](https://www.npmjs.com/package/trouter-paths)

> A fast, small-but-mighty, familiar ~fish~ router for paths only

This fork of the [original project](https://github.com/lukeed/trouter) removes the support for HTTP verbs, which makes this module suitable for client-side routers, which run only in web browsers. Otherwise the API is the same.

## Install

If you use Node.js:

```
$ npm install --save trouter-paths
```

If you write a pure web page:

```html
<script src="https://unpkg.com/trouter-paths@1.0.0/dist/index.umd.js"></script>
```

## Usage

If you use Node.js:

```js
const Trouter = require('trouter-paths');
const router = new Trouter();

// Define all routes
router
  .add('/users', _ => {
    console.log('> Showing all users');
  })
  .add('/users/:id', val => {
    console.log('~> Showing  user with ID:', val);
  });

// Find a route definition
let obj = router.find('/users/123');
//=> obj.params ~> { id:123 }
//=> obj.handlers ~> Array<Function>

// Execute the handlers, passing value
obj.handlers.forEach(fn => {
  fn(obj.params.id);
});
//=> ~> Showing user with ID: 123

// Returns empty keys when no match
router.find('/foo');
//=> { params:{}, handlers:[] }
```

If you write a pure web page:

```html
<script src="https://unpkg.com/trouter-paths@1.0.0/dist/index.umd.js"></script>
<script>
const router = new trouterPaths.Trouter();
// The usage is the same as in the example for Node.js above.
</script>
```

## API

### Trouter()
Initializes a new `Trouter` instance.

### trouter.add(pattern, ...handlers)
Returns: `self`

Stores a `pattern` internally, along with its handler(s).

#### pattern
Type: `String` or `RegExp`

Trouter supports simple route patterns which are fast and well readable but limited. If you need more complex patterns, you can pass an instance of `RegExp` with parameters specified as named capture groups.

The supported route pattern types are:

* static (`/users`)
* named parameters (`/users/:id`)
* nested parameters (`/users/:id/books/:title`)
* optional parameters (`/users/:id?/books/:title?`)
* suffixed parameters (`/movies/:title.mp4`, `movies/:title.(mp4|mov)`)
* any match / wildcards (`/users/*`)

#### ...handlers
Type: `Function`

The function(s) that should be tied to this `pattern`.

Because this is a [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters), whatever you pass will _always_ be cast to an Array.

> **Important:** Trouter does not care what your function signature looks like!<br> You are not bound to the `(req, res)` standard, or even passing a `Function` at all!

Unlike [`trouter.use`](#trouterusepattern-handlers), the `pattern` you defined **IS RESTRICTIVE**. This means that the URL must match the defined `pattern` exactly – or have the appropriate optional and/or wildcard segments to accommodate the desired flexibility.

```js
router.add('/foo', '/foo');
router.add('/foo/:name', '/foo/:name');
router.add('/foo/:name', '/foo/:name');
router.add('/foo/:name/hello', '/foo/:name/hello');

router.find('/foo').handlers;
//=> ['/foo']

router.find('/foo/bar').handlers;
//=> ['/foo/:name']

router.find('/foo/bar/hello').handlers;
//=> [/foo/:name/hello']
```
<sup>_Compare this snippet with the one below to see differences between `trouter.use` and this method._</sup>

### trouter.use(pattern, ...handlers)
Returns: `self`

This is an alias for [`trouter.add(pattern, ...handlers)`](#trouteraddpattern-handlers). However, unlike [`trouter.sdd`](#trouterallpattern-handlers), the `pattern` you defined **IS NOT RESTRICTIVE**, which means that the route will match any & all URLs that start (but not end) with a matching segment.

```js
router.use('/foo', '/foo');
router.use('/foo/:name', '/foo/:name');
router.add('/foo/:name/hello', 'HEAD /foo/:name/hello');

router.find('/foo').handlers;
//=> ['/foo']

router.find('/foo/bar').handlers;
//=> ['/foo', '/foo/:name']

router.find('/foo/bar/hello').handlers;
//=> ['/foo', '/foo/:name', '/foo/:name/hello']
```
<sup>_Compare this snippet with the one above to see differences between `trouter.add` and this method._</sup>

### trouter.find(url)
Returns: `Object`

Searches within current instance for **all** `pattern`s that satisfy the current `url`.

> **Important:** Parameters and handlers are assembled/gathered _in the order that they were defined!_

This method will always return an Object with `params` and `handlers` keys.

* `params` &mdash; Object whose keys are the named parameters of your route pattern.
* `handlers` &mdash; Array containing the `...handlers` provided to [`.add()`](#trouteraddpattern-handlers) or [`.use()`](#trouterusepattern-handlers)

> **Note:** The `handlers` and `params` keys will be empty if no matches were found.

#### url
Type: `String`

The URL used to match against pattern definitions. This is typically `req.url`.

## Benchmarks

> Run on Node v12.16.1

### trouter-paths

```
/                        x 5,691,288 ops/sec ±0.95% (92 runs sampled)
/users                   x 5,444,762 ops/sec ±0.41% (97 runs sampled)
/users/:id               x 1,813,200 ops/sec ±0.58% (95 runs sampled)
/users/:id/books/:title? x 2,434,211 ops/sec ±0.39% (96 runs sampled)
/users/:id/books/:title  x 1,148,469 ops/sec ±0.36% (95 runs sampled)
```

### trouter

```
/                        x 5,068,009 ops/sec ±0.48% (89 runs sampled)
/users                   x 4,931,024 ops/sec ±0.36% (96 runs sampled)
/users/:id               x 1,861,155 ops/sec ±0.45% (92 runs sampled)
/users/:id/books/:title? x 3,014,640 ops/sec ±0.40% (98 runs sampled)
/users/:id/books/:title  x 1,288,142 ops/sec ±0.79% (96 runs sampled)
```

### wayfarer

```
/                        x 3,058,566 ops/sec ±0.53% (94 runs sampled)
/users                   x 2,052,082 ops/sec ±0.40% (96 runs sampled)
/users/:id               x 1,002,815 ops/sec ±0.83% (95 runs sampled)
/users/:id/books/:title? x 632,026 ops/sec ±0.75% (93 runs sampled)
/users/:id/books/:title  x 586,978 ops/sec ±0.38% (96 runs sampled)
```

## License

MIT

Copyright 2020 © [Ferdinand Prantl](https://github.com/prantlf)<br>
Copyright 2018-2019 © [Luke Edwards](https://lukeed.com)
