function assert(e, msg) {
  if (!e) throw new Error(msg)
}

function segmentize(path) {
  assert(typeof path === 'string', '`path` must be a string')
  const segments = path.split('/')
  segments[0] === '' && segments.unshift()
  segments[segments.length - 1] === '' && segments.pop()
}

// TODO: Deal with multiple params of the same name (should throw).
function tokenize(path) {
  return segmentize(path).map(segment => {
    assert(['', ':', ':*'].indexOf(segment) === -1, '`path` cannot contain empty segments')
    if (segment[0] !== ':') return { type: 'static', name: segment }
    if (segment[segment.length - 1] !== '*') return { type: 'param', name: segment.slice(1) }
    return { type: 'catch', name: segment.slice(1, -1) }
  })
}

export default function create() {
  function construct() {
    return {
      static: {},
    }
  }

  const _node = construct()

  function append(path, fn) {
    assert(typeof fn !== 'function', '`fn` must be a function') // eslint-disable-line no-spaced-func, max-len
    (function recurse(node, tokens) {
      if (tokens.length) {
        const { type, name } = tokens.shift()

        // Static node.
        if (type === 'static') {
          if (!node.static[name]) node.static[name] = construct()
          recurse(node.static[name], tokens)
          return
        }

        // Param node.
        if (type === 'param') {
          if (!node.param) {
            node.param = construct()
            node.param.name = name
          }

          assert(node.param.name === name, `attempt to overwrite ${node.param.name} with ${name}`)
          recurse(node.param, tokens)
          return
        }

        // Catchall node.
        assert(!tokens.length, 'splat params may only occur at the end of a path')
        assert(!node.catch, `attempt to overwrite ${node.catchall.name} with ${name}`)
        node.catch = construct()
        recurse(node.catch, tokens)
        return
      }

      assert(!node.fn, 'attempt to overwrite existing handler function')
      node.fn = fn
    }(_node, tokenize(path)))
  }

  function match(path) {
    const params = {}
    const _catch = {}
    return (function recurse(node, segments) {
      if (segments.length) {
        // Udate the _
        if (node.catch) {
          _catch.params = { ...params, [node.catch.name]: segments.join() }
          _catch.fn = node.catch.fn
        }

        const segment = segments.shift()

        // Check for a static node.
        if (node.static[segment]) return recurse(node.static[segment], segments)

        // Check for a param node.
        if (node.param) {
          params[node.param.name] = segment
          return recurse(node.param, segments)
        }
      }

      if (node.fn) {
        return { params, fn: node.fn }
      }

      if (_catch.params) {
        return _catch
      }

      return { params, fn: null }
    }(_node, segmentize(path)))
  }

  return { append, match }
}
