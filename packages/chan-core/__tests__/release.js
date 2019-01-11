const vfile = require('to-vfile');
const { addRelease } = require('..');

test('add release with url', async () => {
  const file = await addRelease(vfile.readSync(`${__dirname}/used.md`), {
    version: '0.0.5',
    gitTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD'
  });

  expect(file.toString()).toMatchSnapshot();
});

test('add release without url', async () => {
  const file = await addRelease(vfile.readSync(`${__dirname}/used.md`), {
    version: '0.0.5'
  });

  expect(file.toString()).toMatchSnapshot();
});

test('add release yanked', async () => {
  const file = await addRelease(vfile.readSync(`${__dirname}/used.md`), {
    version: '0.0.5',
    gitTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD',
    yanked: true
  });

  expect(file.toString()).toMatchSnapshot();
});
