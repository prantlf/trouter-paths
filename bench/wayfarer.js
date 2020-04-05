const { Suite } = require('benchmark');
const wayfarer = require('wayfarer');

const noop = () => {};
const onCycle = (ev) => console.log(String(ev.target));

const routes = [
  ['/', '/'],
  ['/users', '/users'],
  ['/users/:id', '/users/123'],
  ['/users/:id/books/:title?', '/users/123/books'],
  ['/users/:id/books/:title', '/users/123/books/foo']
];

const router = wayfarer();

routes.forEach(arr => {
  router.on(arr[0], noop);
});

routes.forEach(arr => {
  new Suite()
    .add(arr[0], _ => router(arr[1]))
    .on('cycle', onCycle)
    .run();
});
