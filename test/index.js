import { test, Test } from 'tape';
import Trouter from '../index';
import TrouterDefault from '..'; // eslint-disable-line import/no-duplicates

const noop = () => {};

Object.assign(Test.prototype, {
  isEmpty (val, msg) {
    this.ok(!Object.keys(val).length, msg);
  },
  isString (val, msg) {
    this.is(typeof val, 'string', msg);
  },
  isArray (val, msg) {
    this.ok(Array.isArray(val), msg);
  },
  isObject (val, msg) {
    this.ok(Boolean(val) && (val.constructor === Object), msg);
  },
  isFunction (val, msg) {
    this.is(typeof val, 'function', msg);
  },
  isRoute (val, obj = {}) {
    this.isObject(val, '~> route definition is an object');

    if (obj.keys) {
      this.isArray(val.keys, '~~> keys is an Array');
      this.same(val.keys, obj.keys, '~~> keys are expected');
    } else {
      this.is(val.keys, false, '~~> (RegExp) keys is false');
    }
    this.true(val.pattern instanceof RegExp, '~~> pattern is a RegExp');
    if (obj.route) this.true(val.pattern.test(obj.route), '~~> pattern satisfies route');

    this.isArray(val.handlers, '~~> handlers is an Array');
    this.isFunction(val.handlers[0], '~~> each handler is a Function');
    if (obj.count) this.is(val.handlers.length, obj.count, `~~> had ${obj.count} handlers`);
  }
});

test('exports', t => {
  t.isFunction(Trouter, 'exports a function');
  t.deepEqual(Object.keys(Trouter), Object.keys(TrouterDefault), 'bundle exports the same');
  t.end();
});

test('internals', t => {
  const ctx = new Trouter();

  t.true(ctx instanceof Trouter, 'creates new `Trouter` instance');
  t.isArray(ctx.routes, '~> has `routes` key (Array)');

  t.isFunction(ctx.use, '~> has `use` method');
  t.isFunction(ctx.add, '~> has `add` method');
  t.isFunction(ctx.find, '~> has `find` method');

  t.end();
});

test('use()', t => {
  const ctx = new Trouter();

  const out = ctx.use('/foo/:hello', noop);
  t.same(out, ctx, 'returns the Trouter instance (chainable)');

  console.log(' ');
  t.is(ctx.routes.length, 1, 'added "/foo/:hello" route successfully');

  t.isRoute(ctx.routes[0], {
    keys: ['hello'],
    route: '/foo/bar',
    count: 1
  });

  console.log(' ');
  ctx.use('/', [noop, noop, noop]);
  t.is(ctx.routes.length, 2, 'added "/" routes successfully');

  t.isRoute(ctx.routes[1], {
    keys: [],
    route: '/',
    count: 3
  });

  console.log(' ');
  ctx.use('/foo/:world?', noop, [noop, noop], noop);
  t.is(ctx.routes.length, 3, 'added "/foo/:world?" routes successfully');

  t.isRoute(ctx.routes[2], {
    keys: ['world'],
    route: '/foo/hello',
    count: 4
  });

  t.end();
});

test('add() - simple', t => {
  const ctx = new Trouter();

  const out = ctx.add('/foo/:hello', noop);
  t.same(out, ctx, 'returns the Trouter instance (chainable)');

  console.log(' ');
  t.is(ctx.routes.length, 1, 'added "/foo/:hello" route successfully');

  t.isRoute(ctx.routes[0], {
    keys: ['hello'],
    route: '/foo/bar',
    count: 1
  });

  console.log(' ');
  ctx.add('bar', noop);
  t.is(ctx.routes.length, 2, 'added "bar" route successfully');

  t.isRoute(ctx.routes[1], {
    keys: [],
    route: '/bar',
    count: 1
  });

  console.log(' ');
  ctx.add(/^[/]foo[/](?<hello>\w+)[/]?$/, noop);
  t.is(ctx.routes.length, 3, 'added "/^[/]foo[/](?<hello>\\w+)[/]?$/" route successfully');

  t.isRoute(ctx.routes[2], {
    keys: null,
    route: '/foo/bar',
    count: 1
  });

  t.end();
});

test('add() – multiple', t => {
  const ctx = new Trouter();

  ctx.add('/foo/:hello', [noop, noop]);
  t.is(ctx.routes.length, 1, 'added "/foo/:hello" route successfully');

  t.isRoute(ctx.routes[0], {
    keys: ['hello'],
    route: '/foo/howdy',
    count: 2
  });

  console.log(' ');
  ctx.add('/bar', noop, noop, noop);
  t.is(ctx.routes.length, 2, 'added "/bar" route successfully');

  t.isRoute(ctx.routes[1], {
    keys: [],
    route: '/bar',
    count: 3
  });

  t.end();
});

test('add() - complex', t => {
  t.plan();

  const ctx = new Trouter().add('/greet/:name', req => req.chain++);
  t.is(ctx.routes.length, 1, 'added "/greet/:name" route');

  t.isRoute(ctx.routes[0], {
    keys: ['name'],
    route: '/greet/you',
    count: 1
  });

  console.log('/greet/Bob');
  const foo = ctx.find('/greet/Bob');
  t.is(foo.params.name, 'Bob', '~> "params.name" is expected');
  t.is(foo.handlers.length, 1, '~~> "handlers" has 1 item');

  foo.chain = 0;
  foo.handlers.forEach(fn => fn(foo));
  t.is(foo.chain, 1, '~~> handler executed successfully');

  console.log('/greet/Judy');
  const bar = ctx.find('/greet/Judy');
  t.is(bar.params.name, 'Judy', '~> "params.name" is expected');
  t.is(bar.handlers.length, 1, '~~> "handlers" has 1 item');

  bar.chain = 0;
  bar.handlers.forEach(fn => fn(bar));
  t.is(bar.chain, 1, '~~> handler executed successfully');

  console.log('~> add() II');
  ctx.add('/greet/:person', req => {
    t.is(req.chain++, 1, '~> ran new handler');
    t.is(req.params.name, 'Rick', '~~> still see "params.name" value');
    t.is(req.params.person, 'Rick', '~~> receives "params.person" value');
  });

  t.is(ctx.routes.length, 2, 'added another "/greet/:name" route');

  t.isRoute(ctx.routes[1], {
    keys: ['person'],
    route: '/greet/you',
    count: 1
  });

  console.log('/greet/Rick');
  const baz = ctx.find('/greet/Rick');
  t.is(baz.params.name, 'Rick', '~> "params.name" is expected');
  t.is(baz.handlers.length, 2, '~~> "handlers" has 2 items');

  baz.chain = 0;
  baz.handlers.forEach(fn => fn(baz));
  t.is(baz.chain, 2, '~~> handlers executed successfully');

  t.end();
});

test('find()', t => {
  t.plan(9);
  const ctx = new Trouter();

  ctx.add('/foo/:title', req => {
    t.is(req.chain++, 1, '~> 1st "/foo/:title" ran first');
    t.is(req.params.title, 'bar', '~> "params.title" is expected');
  }, req => {
    t.is(req.chain++, 2, '~> 2nd "/foo/:title" ran second');
  });

  const out = ctx.find('/foo/bar');

  t.isObject(out, 'returns an object');
  t.isObject(out.params, '~> has "params" key (object)');
  t.is(out.params.title, 'bar', '~~> "params.title" value is correct');

  t.isArray(out.handlers, '~> has "handlers" key (array)');
  t.is(out.handlers.length, 2, '~~> saved both handlers');

  out.chain = 1;
  out.handlers.forEach(fn => fn(out));
  t.is(out.chain, 3, '~> executes the handler group sequentially');
});

test('find() – no match', t => {
  const ctx = new Trouter();
  const out = ctx.find('/nothing');

  t.isObject(out, 'returns an object');
  t.isEmpty(out.params, '~> "params" is empty');
  t.isEmpty(out.handlers, '~> "handlers" is empty');
  t.end();
});

test('find() – multiple', t => {
  t.plan(20);

  const ctx = (
    new Trouter()
      .use('/foo', req => {
        t.pass('~> ran use("/foo")" route'); // x2
        isRoot || t.is(req.params.title, 'bar', '~~> saw "param.title" value');
        t.is(req.chain++, 0, '~~> ran 1st');
      }, noop)
      .add('/foo', req => {
        t.pass('~> ran "/foo" route');
        t.is(req.chain++, 1, '~~> ran 2nd');
      })
      .add('/foo/:title?', req => {
        t.pass('~> ran "/foo/:title?" route'); // x2
        isRoot || t.is(req.params.title, 'bar', '~~> saw "params.title" value');
        isRoot ? t.is(req.chain++, 2, '~~> ran 3rd') : t.is(req.chain++, 1, '~~> ran 2nd');
      })
      .add('/foo/*', req => {
        t.pass('~> ran "/foo/*" route');
        t.is(req.params.wild, 'bar', '~~> saw "params.wild" value');
        t.is(req.params.title, 'bar', '~~> saw "params.title" value');
        t.is(req.chain++, 2, '~~> ran 3rd');
      })
      .add(/^[/]bar[/]?$/, () => {
        t.pass('~> ran "/]bar[/]?$/" route');
      })
  );

  let isRoot = true;
  console.log('/foo');
  const foo = ctx.find('/foo');
  t.is(foo.handlers.length, 4, 'found 4 handlers');

  foo.chain = 0;
  foo.handlers.forEach(fn => fn(foo));

  isRoot = false;
  console.log('/foo/bar');
  const bar = ctx.find('/foo/bar');
  t.is(bar.handlers.length, 4, 'found 4 handlers');

  bar.chain = 0;
  bar.handlers.forEach(fn => fn(bar));

  console.log('/]bar[/]?$/');
  const bar2 = ctx.find('/bar');
  t.is(bar2.handlers.length, 1, 'found 1 handler');

  bar2.handlers.forEach(fn => fn(bar));
});

test('find() - order', t => {
  t.plan(5);
  const ctx = (
    new Trouter()
      .add('/foo', req => {
        t.is(req.chain++, 0, '~> ran "/foo" 1st');
      })
      .add('/foo', req => {
        t.is(req.chain++, 1, '~> ran "/foo" 2nd');
      })
      .add('/foo', req => {
        t.is(req.chain++, 2, '~> ran "/foo" 3rd');
      })
      .add('/', () => {
        t.pass('should not run');
      })
  );

  const out = ctx.find('/foo');
  t.is(out.handlers.length, 3, 'found 3 handlers');

  out.chain = 0;
  out.handlers.forEach(fn => fn(out));
  t.is(out.chain, 3, 'ran handlers sequentially');
});

test('find() w/ all()', t => {
  const noop = () => {};
  const find = (x, y) => x.find(y);

  const ctx1 = new Trouter().add('api', noop);
  const ctx2 = new Trouter().add('api/:version', noop);
  const ctx3 = new Trouter().add('api/:version?', noop);
  const ctx4 = new Trouter().add('movies/:title.mp4', noop);

  console.log('use("/api")');
  t.is(find(ctx1, '/api').handlers.length, 1, '~> exact match');
  t.is(find(ctx1, '/api/foo').handlers.length, 0, '~> does not match "/api/foo" – too long');

  console.log('use("/api/:version")');
  t.is(find(ctx2, '/api').handlers.length, 0, '~> does not match "/api" only');

  const foo1 = find(ctx2, '/api/v1');
  t.is(foo1.handlers.length, 1, '~> does match "/api/v1" directly');
  t.is(foo1.params.version, 'v1', '~> parses the "version" correctly');

  const foo2 = find(ctx2, '/api/v1/users');
  t.is(foo2.handlers.length, 0, '~> does not match "/api/v1/users" – too long');
  t.is(foo2.params.version, undefined, '~> cannot parse the "version" parameter (not a match)');

  console.log('use("/api/:version?")');
  t.is(find(ctx3, '/api').handlers.length, 1, '~> does match "/api" because optional');

  const bar1 = find(ctx3, '/api/v1');
  t.is(bar1.handlers.length, 1, '~> does match "/api/v1" directly');
  t.is(bar1.params.version, 'v1', '~> parses the "version" correctly');

  const bar2 = find(ctx3, '/api/v1/users');
  t.is(bar2.handlers.length, 0, '~> does match "/api/v1/users" – too long');
  t.is(bar2.params.version, undefined, '~> cannot parse the "version" parameter (not a match)');

  console.log('use("/movies/:title.mp4")');
  t.is(find(ctx4, '/movies').handlers.length, 0, '~> does not match "/movies" directly');
  t.is(find(ctx4, '/movies/narnia').handlers.length, 0, '~> does not match "/movies/narnia" directly');

  const baz1 = find(ctx4, '/movies/narnia.mp4');
  t.is(baz1.handlers.length, 1, '~> does match "/movies/narnia.mp4" directly');
  t.is(baz1.params.title, 'narnia', '~> parses the "title" correctly');

  const baz2 = find(ctx4, '/movies/narnia.mp4/cast');
  t.is(baz2.handlers.length, 0, '~> does match "/movies/narnia.mp4/cast" – too long');
  t.is(baz2.params.title, undefined, '~> cannot parse the "title" parameter (not a match)');

  t.end();
});

test('find() w/ use()', t => {
  const noop = () => {};
  const find = (x, y) => x.find(y);

  const ctx1 = new Trouter().use('api', noop);
  const ctx2 = new Trouter().use('api/:version', noop);
  const ctx3 = new Trouter().use('api/:version?', noop);
  const ctx4 = new Trouter().use('movies/:title.mp4', noop);

  console.log('use("/api")');
  t.is(find(ctx1, '/api').handlers.length, 1, '~> exact match');
  t.is(find(ctx1, '/api/foo').handlers.length, 1, '~> loose match');

  console.log('use("/api/:version")');
  t.is(find(ctx2, '/api').handlers.length, 0, '~> does not match "/api" only');

  const foo1 = find(ctx2, '/api/v1');
  t.is(foo1.handlers.length, 1, '~> does match "/api/v1" directly');
  t.is(foo1.params.version, 'v1', '~> parses the "version" correctly');

  const foo2 = find(ctx2, '/api/v1/users');
  t.is(foo2.handlers.length, 1, '~> does match "/api/v1/users" loosely');
  t.is(foo2.params.version, 'v1', '~> parses the "version" correctly');

  console.log('use("/api/:version?")');
  t.is(find(ctx3, '/api').handlers.length, 1, '~> does match "/api" because optional');

  const bar1 = find(ctx3, '/api/v1');
  t.is(bar1.handlers.length, 1, '~> does match "/api/v1" directly');
  t.is(bar1.params.version, 'v1', '~> parses the "version" correctly');

  const bar2 = find(ctx3, '/api/v1/users');
  t.is(bar2.handlers.length, 1, '~> does match "/api/v1/users" loosely');
  t.is(bar2.params.version, 'v1', '~> parses the "version" correctly');

  console.log('use("/movies/:title.mp4")');
  t.is(find(ctx4, '/movies').handlers.length, 0, '~> does not match "/movies" directly');
  t.is(find(ctx4, '/movies/narnia').handlers.length, 0, '~> does not match "/movies/narnia" directly');

  const baz1 = find(ctx4, '/movies/narnia.mp4');
  t.is(baz1.handlers.length, 1, '~> does match "/movies/narnia.mp4" directly');
  t.is(baz1.params.title, 'narnia', '~> parses the "title" correctly');

  const baz2 = find(ctx4, '/movies/narnia.mp4/cast');
  t.is(baz2.handlers.length, 1, '~> does match "/movies/narnia.mp4/cast" loosely');
  t.is(baz2.params.title, 'narnia', '~> parses the "title" correctly');

  t.end();
});

test('find() - regex w/ named groups', t => {
  t.plan(9);
  const ctx = new Trouter();

  ctx.add(/^[/]foo[/](?<title>\w+)[/]?$/, req => {
    t.is(req.chain++, 1, '~> 1st "/^[/]foo[/](?<title>\\w+)[/]?$/" ran first');
    t.is(req.params.title, 'bar', '~> "params.title" is expected');
  }, req => {
    t.is(req.chain++, 2, '~> 2nd "/^[/]foo[/](?<title>\\w+)[/]?$/" ran second');
  });

  const out = ctx.find('/foo/bar');

  t.isObject(out, 'returns an object');
  t.isObject(out.params, '~> has "params" key (object)');
  t.is(out.params.title, 'bar', '~~> "params.title" value is correct');

  t.isArray(out.handlers, '~> has "handlers" key (array)');
  t.is(out.handlers.length, 2, '~~> saved both handlers');

  out.chain = 1;
  out.handlers.forEach(fn => fn(out));
  t.is(out.chain, 3, '~> executes the handler group sequentially');
});

test('find() – multiple regex w/ named groups', t => {
  t.plan(18);

  const ctx = (
    new Trouter()
      .use('/foo', req => {
        t.pass('~> ran use("/foo")" route'); // x2
        isRoot || t.is(req.params.title, 'bar', '~~> saw "params.title" value');
        t.is(req.chain++, 0, '~~> ran 1st');
      })
      .add('/foo', req => {
        t.pass('~> ran "GET /foo" route');
        t.is(req.chain++, 1, '~~> ran 2nd');
      })
      .add(/^[/]foo(?:[/](?<title>\w+))?[/]?$/, req => {
        t.pass('~> ran "GET /^[/]foo[/](?<title>\\w+)?[/]?$/" route'); // x2
        isRoot || t.is(req.params.title, 'bar', '~~> saw "params.title" value');
        isRoot ? t.is(req.chain++, 2, '~~> ran 3rd') : t.is(req.chain++, 1, '~~> ran 2nd');
      })
      .add(/^[/]foo[/](?<wild>.*)$/, req => {
        t.pass('~> ran "GET /^[/]foo[/](?<wild>.*)$/" route');
        t.is(req.params.wild, 'bar', '~~> saw "params.wild" value');
        t.is(req.params.title, 'bar', '~~> saw "params.title" value');
        t.is(req.chain++, 2, '~~> ran 3rd');
      })
  );

  let isRoot = true;
  console.log('/foo');
  const foo = ctx.find('/foo');
  t.is(foo.handlers.length, 3, 'found 3 handlers');

  foo.chain = 0;
  foo.handlers.forEach(fn => fn(foo));

  isRoot = false;
  console.log('/foo/bar');
  const bar = ctx.find('/foo/bar');
  t.is(bar.handlers.length, 3, 'found 3 handlers');

  bar.chain = 0;
  bar.handlers.forEach(fn => fn(bar));
});
