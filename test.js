const expect = require('expect');
const mux = require('./trie-mux.js');
const noop = function() {};

describe('mux', function() {
  describe('createNode()',function() {
    it('should create a node', function() {
      const trie = mux.createNode();
      expect(trie).toContainKeys(['name',
        'static',
        'param',
        'callback',
        'createRoute',
        'matchRoute'
      ]);
    });
  });

  describe('node', function () {
    describe('createRoute()', function () {
      it('create the appropriate child nodes, and return the leaf node', function() {
        const leaf = mux.createNode()
          .createRoute('/static', noop)
          .createRoute('/:param', noop);

        expect(leaf).toContainKeys(['name',
          'static',
          'param',
          'callback',
          'createRoute',
          'matchRoute'
        ]);
      });

      it('should throw on invalid routes', function() {
        expect(function() { mux.createNode().createRoute('/double//slashes', noop) })
          .toThrow(/double slashes/);
      });

      it('should throw if callback is missing or not a function', function() {
        expect(function() { mux.createNode().createRoute('/') })
          .toThrow(/function/);
        expect(function () { mux.createNode().createRoute('/', {}) })
          .toThrow(/second argument/);
      });
    });

    describe('matchRoute', function () {

    });
  });
});
