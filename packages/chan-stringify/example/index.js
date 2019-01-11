const unified = require('unified');
const markdown = require('remark-parse');
const vfile = require('to-vfile');
const report = require('vfile-reporter');
const remarkToChan = require('@geut/remark-chan');
const stringify = require('..');

unified()
  .use(markdown)
  .use(remarkToChan)
  .use(stringify)
  .process(vfile.readSync(`${__dirname}/../__tests__/CHANGELOG.md`), function(err, file) {
    if (err) throw err;
    console.error(report(file, { quiet: true }));
    console.log(file.contents);
  });
