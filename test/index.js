import create from '../src'
import expect from 'expect'

describe('create()', () => {
  it('should accept a default handler and return the append and match function', () => {
    const { append, match } = create(() => {})
    expect(append).toBeA('function')
    expect(match).toBeA('function')
  })

  it('the default handler should be returned when no match is made', () => {
    const { match } = create(() => 'default handler')
    const { fn } = match('')
    expect(fn).toBeA('function')
    expect(fn()).toBe('default handler')
  })

  describe('append and match', () => {
    const handler = str => () => str
    it('should append and match an empty path handler', () => {
      const { append, match } = create(handler(''))
      append('', handler('empty'))
      const { params, fn } = match('')
      expect(params).toEqual({})
      expect(fn()).toBe('empty')
    })

    it('should ignore prefixed and trailing slashes', () => {
      const { append, match } = create(handler('notfound'))
      append('/some/route/', handler('someroute'))
      append('/', handler('empty'))
      expect(match('some/route').fn()).toBe('someroute')
      expect(match('').fn()).toBe('empty')
    })
  })
})
