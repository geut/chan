import { describe, expect, test } from 'vitest'
import { gitUrlParse } from '../src/index.js'

describe('gitUrlParse({ url })', () => {
  test('returns null for unparseable url', async () => {
    await expect(gitUrlParse({ url: 'not a url' })).resolves.toBe(null)
  })

  test('github templates + branch', async () => {
    const r = await gitUrlParse({ url: 'https://github.com/geut/chan' })

    expect(r).toMatchObject({
      host: 'github.com',
      pathname: 'geut/chan',
      branch: 'HEAD',
      releaseTemplate: 'https://github.com/geut/chan/releases/tag/[next]',
      compareTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]'
    })
  })

  test('gitlab templates + branch', async () => {
    const r = await gitUrlParse({ url: 'https://gitlab.com/geut/chan' })

    expect(r).toMatchObject({
      host: 'gitlab.com',
      pathname: 'geut/chan',
      branch: 'HEAD',
      releaseTemplate: 'https://gitlab.com/geut/chan/-/tags/[next]',
      compareTemplate: 'https://gitlab.com/geut/chan/compare?from=[prev]&to=[next]'
    })
  })

  test('bitbucket templates + branch', async () => {
    const r = await gitUrlParse({ url: 'https://bitbucket.org/geut/chan' })

    expect(r).toMatchObject({
      host: 'bitbucket.org',
      pathname: 'geut/chan',
      branch: 'HEAD',
      releaseTemplate: 'https://bitbucket.org/geut/chan/commits/tag/[next]',
      compareTemplate: 'https://bitbucket.org/geut/chan/branches/compare/[prev]%0D[next]#diff'
    })
  })
})