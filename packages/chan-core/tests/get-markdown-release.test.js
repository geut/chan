import toVFile from 'to-vfile'
import { dirname } from 'dirname-filename-esm'

import { getMarkdownRelease } from '../src/index.js'

test('get markdown release', async () => {
  const release = await getMarkdownRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/used.md`), {
    version: '0.0.4',
  })

  expect(release).toMatchSnapshot()
})

