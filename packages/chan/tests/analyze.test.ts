import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import * as analyze from '../src/commands/analyze.js'
import { runAnalyze } from '../src/commands/analyze.js'
import { MockProvider, type CommitAnalysisResponse } from '@geut/chan-ai'
import { codeMdPath } from '../src/code-md.js'
import { createTempGitRepo } from './fixtures.js'

describe('analyze', () => {
  it('exports yarg command structure', () => {
    expect(analyze.command).toMatch(/analyze/)
    expect(analyze.description).toBeDefined()
    expect(analyze.builder).toBeDefined()
    expect(analyze.builder).toHaveProperty('gitSha')
    expect(analyze.builder).toHaveProperty('auto')
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

    const count = await runAnalyze({ cwd: repo.dir, commitShas: [headSha] })

    expect(count).toBe(1)
    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    expect(content).toContain('# Code Knowledge Base')
    expect(content).toContain(`## Commit ${headSha.slice(0, 7)}`)
    expect(content).toContain('- **Author:** Chan Test User <test@test.com>')
    expect(content).toContain('- **Original message:**')
    expect(content).not.toContain('- **Analysis:**')
  })

  it('appends multiple entries in order', async () => {
    const repo = createTempGitRepo()

    const count = await runAnalyze({
      cwd: repo.dir,
      commitShas: repo.commits,
    })

    expect(count).toBe(3)
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

    const count = await runAnalyze({
      cwd: repo.dir,
      commitShas: [headSha],
      ai: {
        provider: new MockProvider(mockAnalysis),
        model: 'mockModel',
      },
    })

    expect(count).toBe(1)
    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    expect(content).toContain(`## Commit ${headSha.slice(0, 7)}`)
    expect(content).toContain('- **Tags:** Fix')
    expect(content).toContain('- **Packages:** `@geut/chan`')
    expect(content).toContain('- **Analysis:** Synthesized analysis of the change.')
  })
})
