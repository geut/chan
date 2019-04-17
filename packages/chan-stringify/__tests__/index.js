const unified = require('unified');
const markdown = require('remark-parse');
const vfile = require('to-vfile');
const remarkToChan = require('@geut/remark-chan');
const stringify = require('..');

test('compiles chast to markdown', async () => {
  const file = await unified()
    .use(markdown)
    .use(remarkToChan)
    .use(stringify)
    .process(vfile.readSync(`${__dirname}/CHANGELOG.md`));

  expect(file.toString()).toMatchSnapshot();
});
