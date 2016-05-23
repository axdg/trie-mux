# trie-mux

## Usage

```js
var mux = require('trie-mux');

var trie = mux.createNode();

trie.createRoute('/', function () {
  // do something - root route...
  return console.log('hit the root route!');
});

trie.createRoute('/p', function () {
  // do something - posts route...
  return console.log('maybe display a list of posts...');
});

trie.createRoute('/p/:post_id', function (id) {
  // do something - single post route...
  return console.log('maybe display the post: ' + id + '...');
});

var root = trie.match('/'); // => { params: {}, callback }
root.callback(); // => 'hit the root route!'

var posts = trie.match('/p'); // => { params: {}, callback }
posts.callback(); // => 'maybe display a list of posts...'

var post = trie.match('/p/trie-mux'); // => { params: { id: 'trie-mux' }, callback }
post.callback(); // => 'maybe display the post: trie-mux...'

```

## API

```
mux
 - createNode() // => node

node
 - createRoute(path, callback) // => node
 - matchRoute(path) // => { params, callback }
```

