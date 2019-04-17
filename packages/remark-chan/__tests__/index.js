const unified = require('unified');
const markdown = require('remark-parse');
const vfile = require('to-vfile');
const remarkToChan = require('..');

test('parse mdast to chast', () => {
  const markdownTree = unified()
    .use(markdown)
    .parse(vfile.readSync(`${__dirname}/CHANGELOG.md`));

  expect(remarkToChan()(markdownTree)).toMatchSnapshot();
});
