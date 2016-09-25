# trie-mux

> A minimal tree based url path router (or mux)

[![Build Status](https://semaphoreci.com/api/v1/axdg/trie-mux/branches/master/shields_badge.svg)](https://semaphoreci.com/axdg/trie-mux) [![Circle CI](https://circleci.com/gh/axdg/trie-mux/tree/master.svg?style=shield)](https://circleci.com/gh/axdg/trie-mux/tree/master)

trie-mux is a fast and minimal implementation of a [trie](https://en.wikipedia.org/wiki/Trie?oldformat=true) based router. Routers like this are faster than regular expression based routers, and scale better with the number of routes, but that's not really the point.

The real value of a trie based router is that each path supplied to it will match exactly zero or one route(s), and that the order in which routes were declared is of no significance - which makes routing much easier to reason about.

### Installation

Install the package with [npm](https://www.npmjs.com/) and add it to your dependencies:

```
npm install --save trie-mux
```
### Usage

```js
import create from 'trie-mux'

const { append, match } = create(() => 'not found')

append('users/:user/posts', params => params.user) 
append('users/:user/:post', param => `${users}'s post on ${post}`)
append('users/:user/files/:path*', path => `${users}'s file '${path}'`)

const { params, fn } = match('users/axdg/posts')
fn(params) // => axdg

const { params, fn } = match('users/axdg/trie-mux')
fn(params) // => axdg's post on trie-mux

const { params, fn } = match('users/axdg/files/cats/cat.jpg')
fn(params) // => axdg's file 'cats/cat.jpg'
```
