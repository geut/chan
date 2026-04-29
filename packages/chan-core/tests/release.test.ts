import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { readSync } from 'to-vfile'

import { addRelease } from '../src/index.js'

describe('release', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2019, 0, 11))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('add first release with url', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/unreleased.md`),
      {
        version: '0.0.1',
        gitReleaseTemplate: 'https://github.com/geut/chan/releases/tag/[next]',
        gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
        gitBranch: 'HEAD',
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add first release without url', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/unreleased.md`),
      {
        version: '0.0.1',
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add release with url', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/used.md`),
      {
        version: '0.0.5',
        gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
        gitBranch: 'HEAD',
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add release without url', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/used.md`),
      {
        version: '0.0.5',
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add release yanked', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/used.md`),
      {
        version: '0.0.5',
        gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
        gitBranch: 'HEAD',
        yanked: true,
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add release allowing prereleases', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/prereleases.md`),
      {
        version: '0.0.2-beta.3',
        gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
        gitBranch: 'HEAD',
        allowPrerelease: true,
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add release merged with prereleases', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/prereleases.md`),
      {
        version: '0.0.2',
        gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
        gitBranch: 'HEAD',
        mergePrerelease: true,
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })

  it('add release with altered prefix', async () => {
    const file = await addRelease(
      readSync(`${import.meta.dirname}/__files__/unreleased.md`),
      {
        version: '0.0.1',
        gitReleaseTemplate: 'https://github.com/geut/chan/releases/tag/[next]',
        gitCompareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
        gitBranch: 'HEAD',
        releasePrefix: '',
      }
    )

    expect(file.toString()).toMatchSnapshot()
  })
})
