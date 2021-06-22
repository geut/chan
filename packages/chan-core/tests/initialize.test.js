import toVFile from 'to-vfile'
import { dirname } from 'dirname-filename-esm'

import { initialize } from '../src/index.js'

test('initialize changelog', async () => {
  const file = await initialize(toVFile.readSync(`${dirname(import.meta)}/__files__/empty.md`))
  expect(file.toString()).toMatchSnapshot()
})
