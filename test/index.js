import create from '../src'
import expect from 'expect'

describe('create()', () => {
  it('should accept a default handler and return the append and match function', () => {
    const { append, match } = create(() => {})
    expect(append).toBeA('function')
    expect(match).toBeA('function')
  })

  it('should error when no default handler is provided', () => {
    expect(function () {
      create()
    }).toThrow('`def` must be a function')

    // Wrong type
    expect(function () {
      create('notafunction')
    }).toThrow('`def` must be a function')
  })

  it('the default handler should be returned when no match is made', () => {
    const { match } = create(() => 'default handler')
    const { fn } = match('')
    expect(fn).toBeA('function')
    expect(fn()).toBe('default handler')
  })

  describe('append and match', () => {
    const handler = str => () => str
    const noop = handler()
    const notfound = handler('notfound')
    it('should append and match an empty path handler', () => {
      const { append, match } = create(noop)
      append('', handler('empty'))
      const { params, fn } = match('')
      expect(params).toEqual({})
      expect(fn()).toBe('empty')
    })

    it('should ignore prefixed and trailing slashes', () => {
      const { append, match } = create(handler(notfound))
      append('/some/route/', handler('someroute'))
      append('/', handler('empty'))
      expect(match('some/route').fn()).toBe('someroute')
      expect(match('').fn()).toBe('empty')
    })

    it('should match static segments', () => {
      const { append, match } = create(notfound)
      append('a', handler('a'))
      append('a/b', handler('b'))
      append('c', handler('c'))
      append('c/d/e', handler('e'))
      expect(match('a').fn()).toBe('a')
      expect(match('a/b').fn()).toBe('b')
      expect(match('c').fn()).toBe('c')
      expect(match('c/d/e').fn()).toBe('e')
      expect(match('f').fn()).toBe('notfound')
    })

    it('should match param segments', () => {
      const { append, match } = create(notfound)
      append('a', handler('a'))
      append('a/:b', handler('b'))
      append('a/:b/c', handler('c'))
      append('a/d/:e', handler('e'))
      append(':f', handler('f'))

      {
        const { params, fn } = match('a/x')
        expect(params).toEqual({ b: 'x' })
        expect(fn()).toBe('b')
      }

      {
        const { params, fn } = match('a/y/c')
        expect(params).toEqual({ b: 'y' })
        expect(fn()).toBe('c')
      }

      {
        const { params, fn } = match('a/d/z')
        expect(params).toEqual({ e: 'z' })
        expect(fn()).toBe('e')
      }

      {
        const { params, fn } = match('q')
        expect(params).toEqual({ f: 'q' })
        expect(fn()).toBe('f')
      }

      // Should bail early and return no match.
      {
        const { params, fn } = match('a/b/c/d')
        expect(params).toEqual({ b: 'b' })
        expect(fn()).toBe('notfound')
      }

      {
        const { params, fn } = match('x/y/z')
        expect(params).toEqual({ f: 'x' })
        expect(fn()).toBe('notfound')
      }
    })

    it('should match catchall or splat segments', () => {
      const { append, match } = create(notfound)
      append('a', handler('a'))
      append('a/:b*', handler('b'))
      append('a/b/c', handler('c'))

      {
        const { params, fn } = match('a/x')
        expect(params).toEqual({ b: 'x' })
        expect(fn()).toBe('b')
      }

      {
        const { params, fn } = match('a/b/c')
        expect(params).toEqual({})
        expect(fn()).toBe('c')
      }

      {
        const { params, fn } = match('a/b/c/d')
        expect(params).toEqual({ b: 'b/c/d' })
        expect(fn()).toBe('b')
      }

      {
        const { params, fn } = match('x')
        expect(params).toEqual({})
        expect(fn()).toBe('notfound')
      }

      {
        const { params, fn } = match('x/y/z')
        expect(params).toEqual({})
        expect(fn()).toBe('notfound')
      }
    })

    it('should correctly match all three', () => {
      // TODO: Write this.
    })

    it('should error if two params have the same name', () => {
      const { append } = create(notfound)
      expect(function () {
        append('a/:b/c/:b', noop)
      }).toThrow('duplicate param name `b`')
    })

    it('should error before overwriting a handler', () => {
      const { append } = create(notfound)
      append('a/:b/c', handler('one'))
      expect(function () {
        append('a/:b/c', handler('two'))
      }).toThrow('existing handler function')
    })

    it('should error before overwriting a named param', () => {
      const { append } = create(notfound)
      append('/a/:b/c', handler('b'))
      expect(function () {
        append('/a/:d/c', handler('d'))
      }).toThrow('b with d')
    })

    it('should error before appending children to a catchall', () => {
      const { append } = create(notfound)
      expect(function () {
        append('a/:b*/c', handler('c'))
      }).toThrow('end of a path')
    })
  })
})
