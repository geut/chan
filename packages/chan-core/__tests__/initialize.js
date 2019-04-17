const vfile = require('to-vfile');
const { initialize } = require('..');

test('initialize changelog', async () => {
  const file = await initialize(vfile.readSync(`${__dirname}/empty.md`));

  expect(file.toString()).toMatchSnapshot();
});
