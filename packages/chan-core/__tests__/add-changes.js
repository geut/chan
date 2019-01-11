const vfile = require('to-vfile');
const { addChanges } = require('..');

test('add new changes', async () => {
  const file = await addChanges(vfile.readSync(`${__dirname}/used.md`), {
    changes: [
      { action: 'Security', value: 'alguna cosa' },
      {
        action: 'Changed',
        value: 'vaaamos',
        group: 'package2'
      },
      {
        version: '0.0.1',
        action: 'Fixed',
        value: 'fixed algo viejo',
        group: 'package1'
      }
    ]
  });

  expect(file.toString()).toMatchSnapshot();
});
