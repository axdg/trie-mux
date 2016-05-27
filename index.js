var mux = require('./trie-mux.js');

function createRouter(_window) {
  // TODO: This hook needs to be
  if (!_window) {
    _window = window;
  }

  var trie = mux.createNode();
  var notFound;

  return {
    createRoute: function (path, callback) {
      return trie.createRoute(path, callback);
    },
    notFound: function (fn) {
      if (typeof fn !== 'function') {
        throw new Error('router.notFound expects a function');
      }
      notFound = fn;
      return;
    },
    init: function (dispatch) {
      if (typeof dispatch !== 'function') {
        throw new Error('router.init expects dispatch to be a function');
      }

      if (!notFound) {
        throw new Error('router.notFound must be called before router.init');
      }

      // Reset createRoute, it should throw after initialization.
      this.createRoute = function () {
        throw new Error('Cannot call createRoute after initialization');
      };

      // Find a route in the trie, call the callback with it's params.
      function matchRoute(path) {
        var match = trie.matchRoute(path);
        if (!match) {
          return notFound();
        }

        return match.callback(match.params);
      }

      // Attach a popstate listener, to handle browser navigation.
      _window.addEventListener('popstate', function () {
        return dispatch(matchRoute(_window.location.pathname));
      }, false);

      var history = _window.history;

      return function navigate(path, replace) {
        if (replace) {
          history.replaceState(null, null, path);
          return dispatch(matchRoute(path));
        }

        history.pushState(null, null, path);
        return dispatch(matchRoute(path));
      };
    }
  };
}

module.exports = createRouter;
