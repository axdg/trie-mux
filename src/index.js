/**
 * An assertion utility, there's a lot of type
 * checking happening here.
 *
 * @param {Boolean} some predicate
 * @param {String} msg, an error message
 */
function assert(e, msg) {
  if (!e) throw new Error(msg)
}

/**
 * Splits the `pathname` fragment of a url into it's
 * constituent segments, ignoring flanking slashes.
 *
 * @param {String} path
 * @returns {Array} an array of segments
 */
function segmentize(path) {
  assert(typeof path === 'string', '`path` must be a string')
  const segments = path.split('/')
  segments[0] === '' && segments.shift()
  segments[segments.length - 1] === '' && segments.pop()
  return segments
}

/**
 * Transforms a path into an array of tokens to be
 * digested during construction of child nodes in
 * the trie.
 *
 * @param {String} path
 * @param {Array} tokens [{ type, name }]
 */
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

/**
 * Create a trie, a default handler is required.
 *
 * @param {Function} default handler
 * @returns {Object} contains { appned, match }
 */
export default function create(def) {
  assert(typeof def === 'function', '`def` must be a function')
  function construct() {
    return {
      static: {},
    }
  }

  // The root node.
  const _node = construct()

  /**
   * Appends a route to the trie.
   *
   * @param {String} the path of this route
   * @param {Function} the handler for that route
   */
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

  /**
   * Matches a route in the trie. Contructs an object
   * of name / value pairs for any param segments in
   * the match and returns them and the associated
   * handler (or the default handler on no match)
   *
   * @param {String} the path to this route
   * @returns {Object} contains { params, fn }
   */
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
