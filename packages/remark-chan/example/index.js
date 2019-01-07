const unified = require('unified');
const markdown = require('remark-parse');
const vfile = require('to-vfile');
const inspect = require('unist-util-inspect');
const remarkToChan = require('../index.js');

const tree = unified()
  .use(markdown)
  .parse(vfile.readSync(`${__dirname}/example.md`));

console.log(inspect(remarkToChan()(tree)));
