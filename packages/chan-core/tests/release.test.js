import toVFile from 'to-vfile'
import { advanceTo } from 'jest-date-mock'
import { dirname } from 'dirname-filename-esm'

import { addRelease } from '../src/index.js'

beforeEach(() => {
  advanceTo(new Date(2019, 0, 11))
})

test('add first release with url', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/unreleased.md`), {
    version: '0.0.1',
    gitReleaseTemplate: 'https://github.com/geut/chan/releases/tag/[next]',
    gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD'
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add first release without url', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/unreleased.md`), {
    version: '0.0.1'
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add release with url', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/used.md`), {
    version: '0.0.5',
    gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD'
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add release without url', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/used.md`), {
    version: '0.0.5'
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add release yanked', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/used.md`), {
    version: '0.0.5',
    gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD',
    yanked: true
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add release allowing prereleases', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/prereleases.md`), {
    version: '0.0.2-beta.3',
    gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD',
    allowPrerelease: true
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add release merged with prereleases', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/prereleases.md`), {
    version: '0.0.2',
    gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD',
    mergePrerelease: true
  })

  expect(file.toString()).toMatchSnapshot()
})

test('add release with altered prefix', async () => {
  const file = await addRelease(toVFile.readSync(`${dirname(import.meta)}/__files__/unreleased.md`), {
    version: '0.0.1',
    gitReleaseTemplate: 'https://github.com/geut/chan/releases/tag/[next]',
    gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
    gitBranch: 'HEAD',
    releasePrefix: ''
  })

  expect(file.toString()).toMatchSnapshot()
})
