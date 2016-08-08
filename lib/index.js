'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = create;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function assert(e, msg) {
  if (!e) throw new Error(msg);
}

// TODO: Decoding of the URL path
function segmentize(path) {
  assert(typeof path === 'string', '`path` must be a string');
  var segments = path.split('/');
  segments[0] === '' && segments.shift();
  segments[segments.length - 1] === '' && segments.pop();
  return segments;
}

// TODO: Deal with multiple params of the same name (should throw).
function tokenize(path) {
  var names = [];
  return segmentize(path).map(function (segment) {
    assert(['', ':', ':*'].indexOf(segment) === -1, '`path` cannot contain empty segments');
    if (segment[0] !== ':') return { type: 'static', name: segment };

    var type = 'param';
    segment = segment.slice(1);
    if (segment[segment.length - 1] === '*') {
      segment = segment.slice(0, -1);
      type = 'catch';
    }

    assert(!~names.indexOf(segment), '`path` contains duplicate param name `' + segment + '`');
    names.push(segment);
    return { type: type, name: segment };
  });
}

function create(def) {
  assert(typeof def === 'function', '`def` must be a function');
  function construct() {
    return {
      static: {}
    };
  }

  var _node = construct();

  function append(path, fn) {
    assert(typeof fn === 'function', '`fn` must be a function'); // eslint-disable-line no-spaced-func, max-len
    return function recurse(node, tokens) {
      if (tokens.length) {
        var _tokens$shift = tokens.shift();

        var type = _tokens$shift.type;
        var name = _tokens$shift.name;

        // Static node.

        if (type === 'static') {
          if (!node.static[name]) node.static[name] = construct();
          recurse(node.static[name], tokens);
          return;
        }

        // Param node.
        if (type === 'param') {
          if (!node.param) {
            node.param = construct();
            node.param.name = name;
            recurse(node.param, tokens);
            return;
          }

          var param = node.param;
          assert(param.name === name, 'attempt to overwrite ' + (param && param.name) + ' with ' + name);
          recurse(node.param, tokens);
          return;
        }

        // Catchall node.
        var _catch = node.catch;
        assert(!tokens.length, 'splat params may only occur at the end of a path');
        assert(!_catch, 'attempt to overwrite ' + (_catch && _catch.name) + ' with ' + name);
        node.catch = construct();
        node.catch.name = name;
        recurse(node.catch, tokens);
        return;
      }

      assert(!node.fn, 'attempt to overwrite existing handler function');
      node.fn = fn;
    }(_node, tokenize(path));
  }

  function match(path) {
    var params = {};
    var _catch = {};
    return function recurse(node, segments) {
      if (segments.length) {
        if (node.catch) {
          _catch.params = _extends({}, params, _defineProperty({}, node.catch.name, segments.join('/')));
          _catch.fn = node.catch.fn;
        }

        var segment = segments.shift();
        if (node.static[segment]) return recurse(node.static[segment], segments);

        if (node.param) {
          params[node.param.name] = segment;
          return recurse(node.param, segments);
        }

        if (_catch.params) return _catch;
        return { params: params, fn: def };
      }

      if (node.fn) return { params: params, fn: node.fn };
      if (_catch.params) return _catch;
      return { params: params, fn: def };
    }(_node, segmentize(path));
  }

  return { append: append, match: match };
}