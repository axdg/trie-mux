# trie-mux

> A minimal tree based url path router (or mux)

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
