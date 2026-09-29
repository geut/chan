import { mkdirSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it, vi, afterEach } from 'vitest'

import * as analyze from '../src/commands/analyze.js'
import { runAnalyze } from '../src/commands/analyze.js'
import { MockProvider, type CommitAnalysisResponse } from '@geut/chan-ai'
import { codeMdPath } from '../src/code-md.js'
import { createTempGitRepo } from './fixtures.js'

afterEach(() => {
  vi.restoreAllMocks()
})

function commitFiles(dir: string, files: Record<string, string>, message: string): string {
  for (const [path, contents] of Object.entries(files)) {
    const full = join(dir, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, contents)
  }
  execFileSync('git', ['add', '.'], { cwd: dir })
  execFileSync('git', ['commit', '-m', message], { cwd: dir })
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim()
}

describe('analyze', () => {
  it('exports yarg command structure', () => {
    expect(analyze.command).toMatch(/analyze/)
    expect(analyze.description).toBeDefined()
    expect(analyze.builder).toBeDefined()
    expect(analyze.builder).toHaveProperty('gitSha')
    expect(analyze.builder).toHaveProperty('commits')
    expect(analyze.builder).toHaveProperty('aiProvider')
    expect(analyze.builder).toHaveProperty('aiModel')
    expect(analyze.builder).toHaveProperty('aiMaxTokens')
    expect(analyze.builder).toHaveProperty('aiEndpoint')
    expect(analyze.handler).toBeDefined()
  })
})

describe('runAnalyze (raw, no AI)', () => {
  it('appends raw commit entries to .chan/code.md', async () => {
    const repo = createTempGitRepo()
    const headSha = repo.commits[repo.commits.length - 1] ?? ''

    const result = await runAnalyze({ cwd: repo.dir, commitShas: [headSha] })

    expect(result.appended).toBe(1)
    expect(result.skipped).toBe(0)
    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    expect(content).toContain('# Code Knowledge Base')
    expect(content).toContain(`## Commit ${headSha.slice(0, 7)}`)
    expect(content).toContain('- **Author:** Chan Test User <test@test.com>')
    expect(content).toContain('- **Original message:**')
    expect(content).not.toContain('- **Analysis:**')
  })

  it('appends multiple entries in order', async () => {
    const repo = createTempGitRepo()

    const result = await runAnalyze({
      cwd: repo.dir,
      commitShas: repo.commits,
    })

    expect(result.appended).toBe(3)
    expect(result.skipped).toBe(0)
    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    for (const sha of repo.commits) {
      expect(content).toContain(`## Commit ${sha.slice(0, 7)}`)
    }
  })
})

describe('runAnalyze (AI via MockProvider)', () => {
  it('appends entries with AI analysis fields', async () => {
    const repo = createTempGitRepo()
    const headSha = repo.commits[repo.commits.length - 1] ?? ''

    const mockAnalysis: CommitAnalysisResponse = {
      sha: headSha,
      analysis: 'Synthesized analysis of the change.',
      author: 'Chan Test User',
      authorEmail: 'test@test.com',
      coauthors: [],
      date: '2026-07-20T12:00:00+00:00',
      category: 'Fix',
      breakingChange: false,
      breakingDetails: '',
      breakingConfidence: 0.1,
      packagesAffected: ['@geut/chan'],
      relatedCode: ['index.ts'],
      relatedIssues: [],
    }

    const result = await runAnalyze({
      cwd: repo.dir,
      commitShas: [headSha],
      ai: {
        provider: new MockProvider(mockAnalysis),
        model: 'mockModel',
      },
    })

    expect(result.appended).toBe(1)
    expect(result.skipped).toBe(0)
    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    expect(content).toContain(`## Commit ${headSha.slice(0, 7)}`)
    expect(content).toContain('- **Tags:** Fix')
    expect(content).toContain('- **Packages:** `@geut/chan`')
    expect(content).toContain('- **Analysis:** Synthesized analysis of the change.')
  })

  it('skips commits that only update .chan/code.md, CHANGELOG.md, or both', async () => {
    const repo = createTempGitRepo()
    const cases: Record<string, string>[] = [
      { '.chan/code.md': '# Code Knowledge Base\n\nnotes\n' },
      { 'CHANGELOG.md': '# Changelog\n\n## Unreleased\n' },
      {
        '.chan/code.md': '# Code Knowledge Base\n\nboth\n',
        'CHANGELOG.md': '# Changelog\n\nboth\n',
      },
    ]

    for (const files of cases) {
      const sha = commitFiles(repo.dir, files, 'chore: record chan artifacts')
      const invokeSpy = vi.spyOn(MockProvider.prototype, 'invoke')

      const result = await runAnalyze({
        cwd: repo.dir,
        commitShas: [sha],
        ai: {
          provider: new MockProvider({
            sha,
            analysis: 'should not be written',
            author: 'Chan Test User',
            authorEmail: 'test@test.com',
            coauthors: [],
            date: '2026-07-20T12:00:00+00:00',
            category: 'Chore',
            breakingChange: false,
            breakingDetails: '',
            breakingConfidence: 0.1,
            packagesAffected: [],
            relatedCode: [],
            relatedIssues: [],
          }),
          model: 'mockModel',
        },
      })

      expect(result).toEqual({ appended: 0, skipped: 1 })
      expect(invokeSpy).not.toHaveBeenCalled()
      invokeSpy.mockRestore()
    }

    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    expect(content).not.toContain('## Commit')
    expect(content).not.toContain('should not be written')
  })

  it('appends only the non-bookkeeping commit from a mixed batch', async () => {
    const repo = createTempGitRepo()
    const realSha = repo.commits[repo.commits.length - 1] ?? ''
    const bookkeepingSha = commitFiles(
      repo.dir,
      { '.chan/code.md': '# Code Knowledge Base\n\nrecord\n' },
      'chore: record knowledge base'
    )
    const invokeSpy = vi.spyOn(MockProvider.prototype, 'invoke')

    const result = await runAnalyze({
      cwd: repo.dir,
      commitShas: [realSha, bookkeepingSha],
      ai: {
        provider: new MockProvider({
          sha: realSha,
          analysis: 'Real change.',
          author: 'Chan Test User',
          authorEmail: 'test@test.com',
          coauthors: [],
          date: '2026-07-20T12:00:00+00:00',
          category: 'Fix',
          breakingChange: false,
          breakingDetails: '',
          breakingConfidence: 0.1,
          packagesAffected: [],
          relatedCode: [],
          relatedIssues: [],
        }),
        model: 'mockModel',
      },
    })

    expect(result).toEqual({ appended: 1, skipped: 1 })
    expect(invokeSpy).toHaveBeenCalledOnce()
    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    expect(content).toContain(`## Commit ${realSha.slice(0, 7)}`)
    expect(content).not.toContain(`## Commit ${bookkeepingSha.slice(0, 7)}`)
    expect(content).toContain('- **Analysis:** Real change.')
  })
})
