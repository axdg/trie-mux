var mux = require('./trie-mux.js');

function createRouter(dispatch, _window, initialURL) {
  if (typeof dispatch !== 'function') {
    throw new Error('Expected dispatch to be a function');
  }

  // Hook to mock histoty for testing.
  if (!_window) {
    _window = window;
  }

  function createRoute() {}
  function navigate() {}
  function listen() {}

  return {
    createRoute: createRoute,
    navigate: navigate,
    listen: listen
  };
}

module.exports = createRouter;
