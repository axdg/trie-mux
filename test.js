var mux = require('./trie-mux.js');
var expect = require('expect');

// Noop to fake out callbacks.
function noop() {}

// Log util to assert the correct callbacks are present.
function log(str) {
  return function () {
    return str;
  };
}

describe('mux', function () {
  describe('createNode()', function () {
    it('should create a node', function () {
      var trie = mux.createNode();
      expect(trie.name).toEqual('');
      expect(trie.static).toEqual({});
      expect(trie.param).toEqual(null);
      expect(trie.callback).toBe(null);
      expect(trie.createRoute).toBeA('function');
      expect(trie.matchRoute).toBeA('function');
    });
  });

  describe('node', function () {
    describe('createRoute()', function () {
      it('create the appropriate child nodes, and return the leaf node', function () {
        var leaf = mux.createNode()
          .createRoute('/static', noop)
          .createRoute('/:param', noop);

        expect(leaf.name).toEqual('param');
        expect(leaf.static).toEqual({});
        expect(leaf.param).toEqual(null);
        expect(leaf.callback).toBeA('function');
        expect(leaf.createRoute).toBeA('function');
        expect(leaf.matchRoute).toBeA('function');
      });

      it('should throw on invalid routes', function () {
        expect(function () { mux.createNode().createRoute([], noop); })
          .toThrow('string');
        expect(function () { mux.createNode().createRoute('', noop); })
          .toThrow('non-empty');
        expect(function () { mux.createNode().createRoute('double//slashes', noop); })
          .toThrow('double slashes');
        expect(function () { mux.createNode().createRoute(':', noop); })
          .toThrow('must be named');
      });

      it('should throw if callback is missing or not a function', function () {
        expect(function () { mux.createNode().createRoute('/'); })
          .toThrow(/function/);
        expect(function () { mux.createNode().createRoute('/', {}); })
          .toThrow(/second argument/);
      });

      // NOTE: The trie created here is just designed to cover all cases and
      // combinations of static and parameter routes.
      it('should create create static and parametric routes', function () {
        var trie = mux.createNode();
        var root = trie.createRoute('/', log('/'));

        // Asserts that trie and root point to the same object
        expect(trie).toBe(root);
        expect(trie.callback()).toBe('/');

        var a = trie.createRoute('/a', log('a'));
        expect(trie.static.a.callback).toBeA('function');
        expect(trie.static.a.callback()).toBe('a');

        var b = a.createRoute('/:b', log('b'));
        expect(trie.static.a.param.callback).toBeA('function');
        expect(trie.static.a.param.callback()).toBe('b');
        expect(trie.static.a.param.name).toBe('b');

        b.createRoute('/c', log('c'));
        expect(trie.static.a.param.static.c.callback).toBeA('function');
        expect(trie.static.a.param.static.c.callback()).toBe('c');

        b.createRoute('/:d', log('d'));
        expect(trie.static.a.param.param.callback).toBeA('function');
        expect(trie.static.a.param.param.callback()).toBe('d');
        expect(trie.static.a.param.param.name).toBe('d');

        // Since e is not an endpoint, there is not callback;
        trie.createRoute('a/:b/:d/e/f', log('f'));
        expect(trie.static.a.param.param.static.e.callback).toNotExist();
        expect(trie.static.a.param.param.static.e.static.f.callback).toBeA('function');
        expect(trie.static.a.param.param.static.e.static.f.callback()).toBe('f');
      });

      it('should throw if an attempt to re-assign a callback is made', function () {
        var trie = mux.createNode();

        trie.createRoute('static', noop);
        expect(function () { trie.createRoute('static', noop); })
          .toThrow('existing route');

        trie.createRoute(':param', noop);
        expect(function () { trie.createRoute(':param', noop); })
          .toThrow('overwrite');
      });

      it('should throw if an attempt to rename a param is made', function () {
        var trie = mux.createNode();
        trie.createRoute(':this', noop);
        expect(function () { trie.createRoute(':that', noop); })
          .toThrow('Attempt to overwrite parameter `this` with `that`');
      });
    });

    describe('matchRoute()', function () {
      var trie = mux.createNode();
      var root = trie.createRoute('/', log('root'));

      // 'u' and 'p' segments are not endpoints.
      root.createRoute('u/:id', log('user'));
      root.createRoute('u/:id/settings', log('settings'));
      root.createRoute('p/:post', log('post'));

      // Callback is an example of param validation.
      root.createRoute('p/:post/:action', function (params) {
        if (['edit', 'publish'].indexOf(params.action) === -1) {
          return 'invalid';
        }
        return 'valid';
      });

      it('should throw when provided an empty or non-string route', function () {
        expect(function () { mux.createNode().matchRoute(''); })
          .toThrow('non-empty');
        expect(function () { mux.createNode().matchRoute([]); })
          .toThrow('string');
      });

      it('should return an object containing params an callback on match', function () {
        var _root = trie.matchRoute('/');
        expect(Object.keys(_root.params).length).toBe(0);
        expect(_root.callback()).toBe('root');

        var user = trie.matchRoute('/u/axdg');
        expect(Object.keys(user.params).length).toBe(1);
        expect(user.params.id).toBe('axdg');
        expect(user.callback()).toBe('user');

        // Works with a trailing slash.
        var tralingSlash = trie.matchRoute('/u/axdg/');
        expect(tralingSlash.callback()).toBe('user');

        var settings = trie.matchRoute('/u/axdg/settings');
        expect(Object.keys(user.params).length).toBe(1);
        expect(settings.params.id).toBe('axdg');
        expect(settings.callback()).toBe('settings');

        var post = trie.matchRoute('/p/trie-mux');
        expect(Object.keys(user.params).length).toBe(1);
        expect(post.params.post).toBe('trie-mux');
        expect(post.callback()).toBe('post');

        var actions = trie.matchRoute('/p/trie-mux/publish');
        expect(Object.keys(actions.params).length).toBe(2);
        expect(actions.params.post).toBe('trie-mux');
        expect(actions.params.action).toBe('publish');
        expect(actions.callback(actions.params)).toBe('valid');
      });

      it('should return `null` when there is no match', function () {
        // Nodes but not endpoints.
        expect(trie.matchRoute('/u')).toBe(null);
        expect(trie.matchRoute('/u')).toBe(null);

        // Not nodes.
        expect(trie.matchRoute('/u/axdg/set')).toBe(null);
        expect(trie.matchRoute('/nonode')).toBe(null);
        expect(trie.matchRoute('/u/axdg/settings/nonode')).toBe(null);
        expect(trie.matchRoute('/u/axdg/settings//')).toBe(null);
      });
    });
  });
});

// jsdom is used to mock history.
var jsdom = require('jsdom').jsdom;
var redux = require('redux').default;

describe('createRouter()', function () {
  it('should return a router');
  it('should optionally register a click listener');
  it('that call dispatch in response to click events');
  it('should listen to popstate events');
  it('should call dispatch when a popstate event fires');
});

describe('router', function () {
  describe('navigate()', function () {
    it('should allow for programmatic navigation [pushState, replaceState]');
    it('should call dispatch when navigate is called');
  });
});
