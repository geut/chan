# remark-chan

remark plugin to convert mdast to [chast](https://github.com/geut/chan/tree/master/packages/chast)

## Note

Since v3.0 this plugin is ESM only. 

## Install

[npm][]:

```sh
npm install @geut/remark-chan
```

## Use

```js
import unified from 'unified'
import markdown from 'remark-parse'
import { remarkToChan } from '@geut/remark-chan'

unified()
  .use(markdown)
  .use(remarkToChan)
  //.. more plugins
```

## API

### `origin.use(remarkToChan[, destination][, options])`

