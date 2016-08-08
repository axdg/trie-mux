function assert(e, msg) {
  if (!e) throw new Error(msg)
}

// TODO: Decoding of the URL path (path-to-regexp does a good job).
function segmentize(path) {
  assert(typeof path === 'string', '`path` must be a string')
  const segments = path.split('/')
  segments[0] === '' && segments.shift()
  segments[segments.length - 1] === '' && segments.pop()
  return segments
}

function tokenize(path) {
  const names = []
  return segmentize(path).map(segment => {
    assert(['', ':', ':*'].indexOf(segment) === -1, '`path` cannot contain empty segments')
    if (segment[0] !== ':') return { type: 'static', name: segment }

    let type = 'param'
    segment = segment.slice(1)
    if (segment[segment.length - 1] === '*') {
      segment = segment.slice(0, -1)
      type = 'catch'
    }

    assert(!~names.indexOf(segment), `\`path\` contains duplicate param name \`${segment}\``)
    names.push(segment)
    return { type, name: segment }
  })
}

export default function create(def) {
  assert(typeof def === 'function', '`def` must be a function')
  function construct() {
    return {
      static: {},
    }
  }

  const _node = construct()

  function append(path, fn) {
    assert(typeof fn === 'function', '`fn` must be a function') // eslint-disable-line no-spaced-func, max-len
    return (function recurse(node, tokens) {
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
            recurse(node.param, tokens)
            return
          }

          const param = node.param
          assert(param.name === name, `attempt to overwrite ${param && param.name} with ${name}`)
          recurse(node.param, tokens)
          return
        }

        // Catchall node.
        const _catch = node.catch
        assert(!tokens.length, 'splat params may only occur at the end of a path')
        assert(!_catch, `attempt to overwrite ${_catch && _catch.name} with ${name}`)
        node.catch = construct()
        node.catch.name = name
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
        if (node.catch) {
          _catch.params = { ...params, [node.catch.name]: segments.join('/') }
          _catch.fn = node.catch.fn
        }

        const segment = segments.shift()
        if (node.static[segment]) return recurse(node.static[segment], segments)

        if (node.param) {
          params[node.param.name] = segment
          return recurse(node.param, segments)
        }

        if (_catch.params) return _catch
        return { params, fn: def }
      }

      if (node.fn) return { params, fn: node.fn }
      if (_catch.params) return _catch
      return { params, fn: def }
    }(_node, segmentize(path)))
  }

  return { append, match }
}
