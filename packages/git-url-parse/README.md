# git-url-parse

Function to parse a git url and generates template url for the git compare preview.

## Note

Since v3.0 this module is ESM only.

## Install

```sh
npm install @geut/git-url-parse
```

## Use

```js
import { gitUrlParse } from '@geut/git-utl-parse'

console.log(await gitUrlParse({ url: 'https://github.com/geut/chan' }));

```

## API

### `gitUrlParse (options)`

Function to parse a git url and generates template url for the git compare preview.

