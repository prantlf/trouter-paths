const { Suite } = require('benchmark');
const Trouter = require('trouter');

const noop = () => {};
const onCycle = (ev) => console.log(String(ev.target));

const routes = [
  ['GET', '/', '/'],
  ['GET', '/users', '/users'],
  ['GET', '/users/:id', '/users/123'],
  ['GET', '/users/:id/books/:title?', '/users/123/books'],
  ['GET', '/users/:id/books/:title', '/users/123/books/foo'],
  ['GET', /^[/]users[/](?<id>\d+)[/]?$/, '/users/456'],
  ['GET', /^[/]users[/](?<id>\d+)[/]books[/](?<title>[^/]+)[/]?$/, '/users/456/books/foo']
];

const trouter = new Trouter();

routes.forEach(arr => {
  trouter.add(arr[0], arr[1], noop);
});

routes.forEach(arr => {
  new Suite()
    .add(arr[1], _ => trouter.find(arr[0], arr[2]))
    .on('cycle', onCycle)
    .run();
});
