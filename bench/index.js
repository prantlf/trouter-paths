const { Suite } = require('benchmark');
const Trouter = require('..');

const noop = () => {};
const onCycle = (ev) => console.log(String(ev.target));

const routes = [
  ['/', '/'],
  ['/users', '/users'],
  ['/users/:id', '/users/123'],
  ['/users/:id/books/:title?', '/users/123/books'],
  ['/users/:id/books/:title', '/users/123/books/foo'],
  [/^[/]users[/](?<id>\d+)[/]?$/, '/users/456'],
  [/^[/]users[/](?<id>\d+)[/]books[/](?<title>[^/]+)[/]?$/, '/users/456/books/foo']
];

const router = new Trouter();

routes.forEach(arr => {
  router.use(arr[0], noop);
});

routes.forEach(arr => {
  new Suite()
    .add(arr[0], _ => router.find(arr[1]))
    .on('cycle', onCycle)
    .run();
});
