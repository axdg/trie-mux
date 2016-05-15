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
    nextNode.leaf = true;
    return nextNode;
  }

  // Create more children.
  return createChildNode(segments, nextNode)
};

const createNode = () => {
  const _this = {
    static: {},
    name: '',
    param: null,
    leaf: false,
  };

  _this.createRoute = (path) => {
    if (!path || typeof path !== 'string') {
      throw new Error('createRoute exects a non-empty string.');
    }

    return createChildNode(parseSegments(path), _this);
  }

  _this.matchRoute = () => {}

  return _this;
};

const trie = createNode();
trie.createRoute('/some/:thing/or/:other');
console.log(JSON.stringify(trie, null, 2));
