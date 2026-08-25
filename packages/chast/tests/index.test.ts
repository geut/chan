import { describe, expect, it } from 'vitest'
import { createPreface, createRelease, createRoot, type ReleaseNode } from '../src/index.ts'

describe('chast', () => {
  it('createRelease: nulls url when yanked=true', () => {
    const rel = createRelease({
      identifier: 'my-pkg',
      version: '1.2.3',
      yanked: true,
      url: 'https://example.com/compare',
    })

    expect(rel.type).toBe('release')
    expect(rel.url).toBeNull()
  })

  it('createRoot: keeps preface and sorts releases (Unreleased first, then semver desc)', () => {
    const preface = createPreface([{ type: 'text', children: 'Hello' } as Record<string, unknown>])

    const r100 = createRelease({
      identifier: 'x',
      version: '1.0.0',
      yanked: false,
      url: null,
    })
    const r200 = createRelease({
      identifier: 'x',
      version: '2.0.0',
      yanked: false,
      url: null,
    })
    const runrel = createRelease({
      identifier: 'x',
      version: 'Unreleased',
      yanked: false,
      url: null,
    })

    const root = createRoot([r100, preface, r200, runrel] as (
      | Record<string, unknown>
      | ReleaseNode
    )[])

    const children = (root as any).children as any[]
    expect(children[0].type).toBe('preface')

    const versions = children.filter(c => c.type === 'release').map(r => r.version)
    expect(versions).toEqual(['Unreleased', '2.0.0', '1.0.0'])
  })

  it('createRoot: drops falsy entries in input', () => {
    const r100 = createRelease({
      identifier: 'x',
      version: '1.0.0',
      yanked: false,
      url: null,
    })
    const root = createRoot([null, undefined, false, r100] as (
      | Record<string, unknown>
      | ReleaseNode
    )[])

    const children = root.children as (Record<string, unknown> | ReleaseNode)[]
    expect(children).toHaveLength(1)
    expect(children[0].type).toBe('release')
  })
})