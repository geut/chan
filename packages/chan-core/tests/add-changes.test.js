import toVFile from 'to-vfile'
import { dirname } from 'dirname-filename-esm'
import { addChanges } from '../src/index.js'

test('add new changes', async () => {
  const file = await addChanges(toVFile.readSync(`${dirname(import.meta)}/__files__/used.md`), {
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
