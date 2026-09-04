import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { vi, describe, expect, it, beforeEach } from 'vitest'

import * as release from '../src/commands/release.js'
import { appendEntries, formatEntry } from '../src/code-md.js'
import type { CommitMetadata } from '../src/git.js'

// Control whether AI is "enabled" for the release handler.
const resolveAiConfigMock = vi.fn()
vi.mock('../src/ai-config.js', () => ({
  resolveAiConfig: (...args: unknown[]) => resolveAiConfigMock(...args),
}))

describe('release', () => {
  beforeEach(() => {
    resolveAiConfigMock.mockReset()
    resolveAiConfigMock.mockReturnValue(undefined) // AI disabled by default
  })

  it('exports yarg command structure', () => {
    expect(release.command).toMatch(/release/)
    expect(release.description).toBeDefined()

    expect(release.builder).toBeDefined()
    expect(release.builder).toHaveProperty('semver')
    expect(release.builder).toHaveProperty('path')
    expect(release.builder).toHaveProperty('yanked')
    expect(release.builder).toHaveProperty('git-release-template')
    expect(release.builder).toHaveProperty('git-compare-template')
    expect(release.builder).toHaveProperty('git-url')
    expect(release.builder).toHaveProperty('git-branch')
    expect(release.builder).toHaveProperty('allow-yanked')
    expect(release.builder).toHaveProperty('allow-prerelease')
    expect(release.builder).toHaveProperty('merge-prerelease')
    expect(release.builder).toHaveProperty('ghrelease')
    expect(release.builder).toHaveProperty('git')
    expect(release.builder).toHaveProperty('release-prefix')
    expect(release.builder).toHaveProperty('ci')

    expect(release.handler).toBeDefined()
  })
})

describe('release AI breaking-change guard', () => {
  beforeEach(() => {
    resolveAiConfigMock.mockReset()
  })

  function tempRepoWithChangelog(): string {
    const cwd = mkdtempSync(join(tmpdir(), 'chan-release-'))
    writeFileSync(
      join(cwd, 'CHANGELOG.md'),
      `# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
`
    )
    return cwd
  }

  const breakingMeta: CommitMetadata = {
    sha: '0123456789abcdef0123456789abcdef01234567',
    shortSha: '0123456',
    author: 'T',
    authorEmail: 't@t.com',
    date: '2026-07-20T12:00:00+00:00',
    message: 'feat!: remove export',
    files: ['a.ts'],
  }

  it('errors when AI is enabled, a breaking change is found, and semver is not breaking-appropriate', async () => {
    const cwd = tempRepoWithChangelog()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({
          meta: breakingMeta,
          analysis: {
            sha: '0123456',
            analysis: 'breaking',
            author: 'T',
            authorEmail: 't@t.com',
            coauthors: [],
            date: '2026-07-20T12:00:00+00:00',
            category: 'Feature',
            breakingChange: true,
            breakingDetails: 'Removed public export.',
            breakingConfidence: 0.9,
            packagesAffected: [],
            relatedCode: [],
            relatedIssues: [],
          },
        }),
      ],
    })

    resolveAiConfigMock.mockReturnValue({
      provider: 'openai',
      model: 'gpt-4o',
    })

    // 1.5.0 is a minor, not breaking-appropriate (not x.0.0).
    await expect(
      release.handler({
        semver: '1.5.0',
        path: cwd,
        allowYanked: false,
        allowPrerelease: false,
        mergePrerelease: false,
        releasePrefix: 'v',
        ghrelease: false,
        git: false,
        ci: false,
      })
    ).resolves.toBeUndefined()
    expect(process.exitCode).toBe(1)
    process.exitCode = undefined
  })

  it('does not error with --ci (annotates instead)', async () => {
    const cwd = tempRepoWithChangelog()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({
          meta: breakingMeta,
          analysis: {
            sha: '0123456',
            analysis: 'breaking',
            author: 'T',
            authorEmail: 't@t.com',
            coauthors: [],
            date: '2026-07-20T12:00:00+00:00',
            category: 'Feature',
            breakingChange: true,
            breakingDetails: 'Removed public export.',
            breakingConfidence: 0.9,
            packagesAffected: [],
            relatedCode: [],
            relatedIssues: [],
          },
        }),
      ],
    })

    resolveAiConfigMock.mockReturnValue({
      provider: 'openai',
      model: 'gpt-4o',
    })

    await expect(
      release.handler({
        semver: '1.5.0',
        path: cwd,
        allowYanked: false,
        allowPrerelease: false,
        mergePrerelease: false,
        releasePrefix: 'v',
        ghrelease: false,
        git: false,
        ci: true,
      })
    ).resolves.toBeUndefined()
    // --ci warns but does not set the error exit code on the breaking check.
    expect(process.exitCode).toBeUndefined()
  })

  it('proceeds when the semver is breaking-appropriate (x.0.0)', async () => {
    const cwd = tempRepoWithChangelog()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({
          meta: breakingMeta,
          analysis: {
            sha: '0123456',
            analysis: 'breaking',
            author: 'T',
            authorEmail: 't@t.com',
            coauthors: [],
            date: '2026-07-20T12:00:00+00:00',
            category: 'Feature',
            breakingChange: true,
            breakingDetails: 'Removed public export.',
            breakingConfidence: 0.9,
            packagesAffected: [],
            relatedCode: [],
            relatedIssues: [],
          },
        }),
      ],
    })

    resolveAiConfigMock.mockReturnValue({
      provider: 'openai',
      model: 'gpt-4o',
    })

    // 2.0.0 is breaking-appropriate; the guard should not block.
    await expect(
      release.handler({
        semver: '2.0.0',
        path: cwd,
        allowYanked: false,
        allowPrerelease: false,
        mergePrerelease: false,
        releasePrefix: 'v',
        ghrelease: false,
        git: false,
        ci: false,
      })
    ).resolves.toBeUndefined()
    expect(process.exitCode).toBeUndefined()
  })
})
