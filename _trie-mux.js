const parseSegments = (path) => {
  const ret = path.split('/');

  // strip starting slash
  if (ret[0] === '') {
    ret.shift();
  }

  // strip trailing slash
  if (ret[ret.length - 1] === '') {
    ret.pop();
  }

  // There are still empty segments
  if (ret.indexOf('') !== -1) {
    throw new Error('Supplied path contains double slashes.');
  }

  return ret;
};

const createChildNode = (segments, node) => {
  var segment = segments.shift();
  var nextNode = null;

  // Segment is a parameter
  if (segment[0] === ':') {
    segment = segment.substring(1);

    if (!node.param) {
      nextNode = node.param = createNode();
      nextNode.name = segment;
    } else {
      if (node.param.name !== segment) {
        throw new Error(
          'Attempt to overwrite parameter `' +
          node.param.name + '` with `' + segment + '`.'
        );
      } else {
        nextNode = node.param;
      }
    }
  } else if (!node.static[segment]) {
    nextNode =  node.static[segment] = createNode();
  } else {
    nextNode = node.static.segment;
  }

  // No more segments, return the newly created child.
  if (!segments.length) {
    nextNode.endpoint = true;
    return nextNode;
  }

  // Create more children.
  return createChildNode(segments, nextNode)
};

const findNode = (segments, node, params) => {
  if (segments.length) {
    const segment = segments.shift();

    // Static node
    if (node.static[segment]) {
      return findNode(segments, node.static[segment]);
    }

    if (node.param) {
      params.push(segment);
      return findNode(segments, node.param, params);
    }

    return;
  }

  if (node.endpoint) {
    return params;
  }

  return;
};

// TODO: endpoint needs to be replaced with an object or callback.
const createNode = (root) => {
  const _this = {
    static: {},
    name: '',
    param: null,
    endpoint: false,
  };

  _this.createRoute = (path) => {
    if (!path || typeof path !== 'string') {
      throw new Error('createRoute expects a non-empty string.');
    }

    // TODO: Change the order of the arguments, pass in the node first.
    return createChildNode(parseSegments(path), _this);
  }

  _this.matchRoute = (path) => {
    if (!path || typeof path !== 'string') {
      throw new Error('matchRoute expects a non-empty string.');
    }

    // TODO: Change the order of the arguments, pass in the node first.
    return findNode(parseSegments(path), _this, {});
  }

  return _this;
};

const trie = createNode();
trie.createRoute('/some/:thing/or/:other');
console.log(JSON.stringify(trie, null, 2));
