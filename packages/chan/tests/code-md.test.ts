import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import {
  CODE_MD_FILENAME,
  CODE_MD_HEADING,
  appendEntries,
  codeMdPath,
  formatEntry,
  initCodeMd,
} from '../src/code-md.js'
import type { CommitMetadata } from '../src/git.js'

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'chan-codemd-'))
}

const rawMeta: CommitMetadata = {
  sha: '0123456789abcdef0123456789abcdef01234567',
  shortSha: '0123456',
  author: 'Chan Test User',
  authorEmail: 'test@test.com',
  date: '2026-07-20T12:00:00+00:00',
  message: 'feat: add thing',
  files: ['index.ts', 'src/util.ts'],
}

describe('formatEntry', () => {
  it('formats a raw entry (no AI) with author, date, files and original message', () => {
    const entry = formatEntry({ meta: rawMeta })
    expect(entry).toContain('## Commit 0123456')
    expect(entry).toContain('- **Author:** Chan Test User <test@test.com>')
    expect(entry).toContain('- **Date:** 2026-07-20T12:00:00+00:00')
    expect(entry).toContain('- **Files:** `index.ts`, `src/util.ts`')
    expect(entry).toContain('- **Original message:** feat: add thing')
    expect(entry).not.toContain('- **Tags:**')
    expect(entry).not.toContain('- **Analysis:**')
  })

  it('formats an AI entry with tags, packages, analysis and breaking info', () => {
    const entry = formatEntry({
      meta: rawMeta,
      analysis: {
        sha: '0123456',
        analysis: 'Adds a new thing.',
        author: 'Chan Test User',
        authorEmail: 'test@test.com',
        coauthors: ['contributor@example.com'],
        date: '2026-07-20T12:00:00+00:00',
        category: 'Feature',
        breakingChange: true,
        breakingDetails: 'Public surface changed.',
        breakingConfidence: 0.9,
        packagesAffected: ['@geut/chan'],
        relatedCode: ['index.ts'],
        relatedIssues: ['#42'],
      },
    })
    expect(entry).toContain('- **Tags:** Feature (breaking, confidence 0.9)')
    expect(entry).toContain('- **Packages:** `@geut/chan`')
    expect(entry).toContain('- **Analysis:** Adds a new thing.')
    expect(entry).toContain('- **Breaking details:** Public surface changed.')
    expect(entry).toContain('- **Related code:** index.ts')
    expect(entry).toContain('- **Related issues:** #42')
    expect(entry).toContain('- **Coauthors:** contributor@example.com')
  })
})

describe('appendEntries', () => {
  it('creates the file with the heading when it does not exist', async () => {
    const cwd = tempDir()
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })

    const content = await readFile(codeMdPath(cwd), 'utf8')
    expect(content.startsWith(CODE_MD_HEADING)).toBe(true)
    expect(content).toContain('## Commit 0123456')
  })

  it('appends without duplicating the heading when the file already exists', async () => {
    const cwd = tempDir()
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })

    const secondMeta = { ...rawMeta, shortSha: 'fedcba0', message: 'fix: other thing' }
    await appendEntries({ cwd, entries: [formatEntry({ meta: secondMeta })] })

    const content = await readFile(codeMdPath(cwd), 'utf8')
    const headingCount = (content.match(/# Code Knowledge Base/g) ?? []).length
    expect(headingCount).toBe(1)
    expect(content).toContain('## Commit 0123456')
    expect(content).toContain('## Commit fedcba0')
  })

  it('is a no-op when there are no entries', async () => {
    const cwd = tempDir()
    await appendEntries({ cwd, entries: [] })
    await expect(readFile(codeMdPath(cwd), 'utf8')).rejects.toThrow()
  })
})

describe('initCodeMd', () => {
  it('creates a starter file with the heading', async () => {
    const cwd = tempDir()
    await initCodeMd(cwd)
    const content = await readFile(join(cwd, '.chan', CODE_MD_FILENAME), 'utf8')
    expect(content).toBe(CODE_MD_HEADING)
  })

  it('does not overwrite an existing knowledge base', async () => {
    const cwd = tempDir()
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })
    const before = await readFile(codeMdPath(cwd), 'utf8')

    await initCodeMd(cwd)
    const after = await readFile(codeMdPath(cwd), 'utf8')

    expect(after).toBe(before)
  })
})
