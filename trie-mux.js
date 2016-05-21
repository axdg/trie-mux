function parseSegments(path) {
  if (path === '/') {
    return [];
  }

  const segments = path.split('/');

  // Strip initial slash.
  if (segments[0] === '') {
    segments.shift();
  }

  // Strip trailing slash.
  if (segments[segments.length - 1] === '') {
    segments.pop();
  }

  return segments;
}

function createChildNode(node, segments, callback) {
  if (segments.length) {
    var segment = segments.shift();
    var nextNode = null;

    // Create a parameter node..
    if (segments[0] === ':') {
      segment = segment.substring(1);
      if (!node.param) {
        nextNode = node.param = createNode();
        nextNode.name = segment;
      }

      if (node.param.name !== segment) {
        throw new Error(
          'Attempt to overwrite parameter `' +
          node.param.name + '` with `' + segment + '`.'
        );
      } else {
        nextNode = node.param;
      }

      return createChildNode(nextNode, segments, callback);
    }

    // Create a static node.
    if (!node.static[segment]) {
      nextNode =  node.static[segment] = createNode();
    } else {
      nextNode = node.static[segment];
    }

    return createChildNode(nextNode, segments, callback);
  }

  // No more segments, attach the callback.
  if (node.callback) {
    throw new Error('Attempt to overwrite existing callback');
  }

  node.callback = callback;
  return node;
}

function findNode(node, segments, params) {
  if (segments.length) {
    var segment = segments.shift();

    // Static node
    if (node.static[segment]) {
      return findNode(node.static[segment], segments, params);
    }

    if (node.param) {
      params.push(segment);
      return findNode(node.param, segments, params);
    }

    return null;
  }

  if (node.callback) {
    return node.callback.bind(null, params);
  }

  return null;
}

// TODO: create this with
function createNode() {
  var _this = {
    name: '',
    static: {},
    param: null,
    callback: null,
  };

  _this.createRoute = function(path, callback) {
    if (!path || typeof path !== 'string') {
      throw new Error('createRoute requires a non-empty path string');
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error('createRoute expects a function as the second argument');
    }

    const segments = parseSegments(path);

    // There are still empty segments.
    if (segments.indexOf('') !== -1) {
      throw new Error('Supplied path contains double slashes.');
    }

    return createChildNode(_this, segments, callback);
  }

  _this.matchRoute = function(path) {
    if (!path || typeof path !== 'string') {
      throw new Error('matchRoute expects a non-empty path string.');
    }

    return findNode(_this, parseSegments(path), {});
  }

  return _this;
}

// TODO: Implement this.
function stringify() {}

mux = {
  createNode: createNode,
  stringify: stringify,
};

module.exports = mux;
