import parse from 'regexparam';

export default class Trouter {
  constructor () {
    this.routes = [];
  }

  use (route, ...fns) {
    const handlers = [].concat.apply([], fns);
    const { keys, pattern } = parse(route, true);
    this.routes.push({ keys, pattern, handlers });
    return this;
  }

  add (route, ...fns) {
    const { keys, pattern } = parse(route);
    const handlers = [].concat.apply([], fns);
    this.routes.push({ keys, pattern, handlers });
    return this;
  }

  find (url) {
    let i = 0; let j = 0; let k; let tmp; const arr = this.routes;
    let matches = []; const params = {}; let handlers = [];
    for (; i < arr.length; i++) {
      tmp = arr[i];
      if (tmp.keys === false) {
        matches = tmp.pattern.exec(url);
        if (matches === null) continue;
        if (matches.groups !== undefined) for (k in matches.groups) params[k] = matches.groups[k];
        tmp.handlers.length > 1 ? (handlers = handlers.concat(tmp.handlers)) : handlers.push(tmp.handlers[0]);
      } else if (tmp.keys.length > 0) {
        matches = tmp.pattern.exec(url);
        if (matches === null) continue;
        for (j = 0; j < tmp.keys.length;) params[tmp.keys[j]] = matches[++j];
        tmp.handlers.length > 1 ? (handlers = handlers.concat(tmp.handlers)) : handlers.push(tmp.handlers[0]);
      } else if (tmp.pattern.test(url)) {
        tmp.handlers.length > 1 ? (handlers = handlers.concat(tmp.handlers)) : handlers.push(tmp.handlers[0]);
      }
    }

    return { params, handlers };
  }
}
