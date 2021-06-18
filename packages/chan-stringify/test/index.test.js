import unified from 'unified'
import markdown from 'remark-parse'
import { remarkToChan } from '@geut/remark-chan'
import toVFile from 'to-vfile'
import { dirname } from 'dirname-filename-esm'

import { PREFACE } from './chast-parts.js'

import { stringify } from '../src/index.js'

const processor = await unified()
  .use(markdown)
  .use(remarkToChan)
  .use(stringify)

test('compile initial chast to markdown', async () => {
  const tree =  {
    type: 'root',
    children: [
      PREFACE, 
      {
        type: 'release',
        identifier: 'unreleased',
        version: 'Unreleased',
        unreleased: true,
        children: []
      }
    ]
  }
  expect(processor.stringify(tree)).toMatchSnapshot()
})

test('compile unreleased changes chast to markdown', async () => {
  const tree =  {
    type: 'root',
    children: [
      PREFACE, 
      {
        type: 'release',
        identifier: 'unreleased',
        version: 'Unreleased',
        unreleased: true,
        children: []
      },
      { 
        type: 'release',
        identifier: '0.0.2',
        version: '0.0.2',        
        date: '2000-01-01',
        yanked: true,
        children: []
      },
      { 
        type: 'release',
        identifier: '0.0.1',
        version: '0.0.1',
        date: '2000-01-01',
        children: []
      }
    ]
  }
  expect(processor.stringify(tree)).toMatchSnapshot()
})

test('compiles chast to markdown', async () => {
  const file = await processor.process(toVFile.readSync(`${dirname(import.meta)}/__files__/CHANGELOG.md`));

  expect(file.toString()).toMatchSnapshot();
});

test('compile initialized file', async () => {
  const file = await processor.process(toVFile.readSync(`${dirname(import.meta)}/__files__/00-CHANGELOG.md`));

  expect(file.toString()).toMatchSnapshot();
})