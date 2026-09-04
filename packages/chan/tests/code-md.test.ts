import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import {
  CODE_MD_FILENAME,
  CODE_MD_HEADING,
  CONTEXT_END_MARKER,
  CONTEXT_START_MARKER,
  appendEntries,
  appendActionEntry,
  codeMdPath,
  commitsSinceLastAction,
  formatActionEntry,
  formatContextSection,
  formatEntry,
  hasContextSection,
  initCodeMd,
  isContextEmpty,
  readContextSection,
  scanBreakingChanges,
  writeContextSection,
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

describe('formatActionEntry', () => {
  it('formats an action entry with classification and linked commits', () => {
    const entry = formatActionEntry({
      action: 'added',
      date: '2026-07-20T12:00:00+00:00',
      message: 'Add multiply function',
      classification: ['Feature'],
      commits: ['0123456', 'fedcba0'],
      group: 'math',
    })
    expect(entry).toContain('## Action added')
    expect(entry).toContain('- **Date:** 2026-07-20T12:00:00+00:00')
    expect(entry).toContain('- **Message:** Add multiply function')
    expect(entry).toContain('- **Classification:** Feature')
    expect(entry).toContain('- **Commits:** `0123456`, `fedcba0`')
    expect(entry).toContain('- **Group:** math')
  })

  it('records breaking details when present', () => {
    const entry = formatActionEntry({
      action: 'changed',
      date: '2026-07-20T12:00:00+00:00',
      message: 'Rename export',
      classification: ['Refactor', 'Feature'],
      commits: ['0123456'],
      breakingChange: true,
      breakingDetails: 'Public export renamed.',
    })
    expect(entry).toContain('- **Breaking change:** yes')
    expect(entry).toContain('- **Breaking details:** Public export renamed.')
    expect(entry).toContain('- **Classification:** Refactor, Feature')
  })
})

describe('appendActionEntry', () => {
  it('appends an action entry after commit entries', async () => {
    const cwd = tempDir()
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })
    await appendActionEntry({
      cwd,
      entry: formatActionEntry({
        action: 'added',
        date: '2026-07-20T12:00:00+00:00',
        message: 'Add thing',
        classification: ['Feature'],
        commits: ['0123456'],
      }),
    })
    const content = await readFile(codeMdPath(cwd), 'utf8')
    expect(content).toContain('## Commit 0123456')
    expect(content).toContain('## Action added')
  })
})

describe('commitsSinceLastAction', () => {
  it('returns all commit SHAs when there is no action yet', async () => {
    const cwd = tempDir()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({ meta: { ...rawMeta, shortSha: 'aaaaaaa' } }),
        formatEntry({ meta: { ...rawMeta, shortSha: 'bbbbbbb' } }),
      ],
    })
    const shas = await commitsSinceLastAction(cwd)
    expect(shas).toEqual(['aaaaaaa', 'bbbbbbb'])
  })

  it('returns only commits after the last action marker', async () => {
    const cwd = tempDir()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({ meta: { ...rawMeta, shortSha: 'aaaaaaa' } }),
        formatActionEntry({
          action: 'added',
          date: '2026-07-20T12:00:00+00:00',
          message: 'release 1',
          classification: ['Feature'],
          commits: ['aaaaaaa'],
        }),
        formatEntry({ meta: { ...rawMeta, shortSha: 'ccccccc' } }),
      ],
    })
    const shas = await commitsSinceLastAction(cwd)
    expect(shas).toEqual(['ccccccc'])
  })
})

describe('scanBreakingChanges', () => {
  it('returns breaking commit entries before the last action marker', async () => {
    const cwd = tempDir()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({
          meta: { ...rawMeta, shortSha: 'aaaaaaa' },
          analysis: {
            sha: 'aaaaaaa',
            analysis: 'breaking change',
            author: 'A',
            authorEmail: 'a@a.com',
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
        formatActionEntry({
          action: 'added',
          date: '2026-07-20T12:00:00+00:00',
          message: 'release 1',
          classification: ['Feature'],
          commits: ['aaaaaaa'],
        }),
        // This breaking commit is AFTER the action → unreleased, should be found.
        formatEntry({
          meta: { ...rawMeta, shortSha: 'ddddddd' },
          analysis: {
            sha: 'ddddddd',
            analysis: 'another breaking',
            author: 'A',
            authorEmail: 'a@a.com',
            coauthors: [],
            date: '2026-07-20T12:00:00+00:00',
            category: 'Refactor',
            breakingChange: true,
            breakingDetails: 'Renamed CLI flag.',
            breakingConfidence: 0.85,
            packagesAffected: [],
            relatedCode: [],
            relatedIssues: [],
          },
        }),
      ],
    })
    const findings = await scanBreakingChanges(cwd)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.sha).toBe('ddddddd')
    expect(findings[0]?.breakingDetails).toBe('Renamed CLI flag.')
    expect(findings[0]?.confidence).toBe(0.85)
  })

  it('returns all breaking commits when there is no action marker', async () => {
    const cwd = tempDir()
    await appendEntries({
      cwd,
      entries: [
        formatEntry({
          meta: { ...rawMeta, shortSha: 'aaaaaaa' },
          analysis: {
            sha: 'aaaaaaa',
            analysis: 'breaking',
            author: 'A',
            authorEmail: 'a@a.com',
            coauthors: [],
            date: '2026-07-20T12:00:00+00:00',
            category: 'Fix',
            breakingChange: true,
            breakingDetails: 'x',
            breakingConfidence: 1,
            packagesAffected: [],
            relatedCode: [],
            relatedIssues: [],
          },
        }),
      ],
    })
    const findings = await scanBreakingChanges(cwd)
    expect(findings).toHaveLength(1)
  })
})

const sampleContext = {
  description: 'A changelog management tool with an AI layer.',
  usage: 'CLI: chan <command>; post-commit hook appends entries.',
  runtimes: ['node', 'cli'],
  projectTypes: ['module', 'cli tool'],
  requirements: ['Node >= 20', 'git'],
  notes: ['monorepo (packages/chan, chan-ai)', 'vitest for tests'],
}

const emptyContext = {
  description: '',
  usage: '',
  runtimes: [],
  projectTypes: [],
  requirements: [],
  notes: [],
}

describe('formatContextSection', () => {
  it('renders all six fields between the chan:context markers', () => {
    const section = formatContextSection(sampleContext)

    expect(section.startsWith(CONTEXT_START_MARKER)).toBe(true)
    expect(section.endsWith(`${CONTEXT_END_MARKER}\n`)).toBe(true)
    expect(section).toContain('## Context')
    expect(section).toContain('- **Description:** A changelog management tool with an AI layer.')
    expect(section).toContain('- **Usage:** CLI: chan <command>; post-commit hook appends entries.')
    expect(section).toContain('- **Runtimes:** node, cli')
    expect(section).toContain('- **Project types:** module, cli tool')
    expect(section).toContain('- **Requirements:** Node >= 20, git')
    expect(section).toContain('- **Notes:** monorepo (packages/chan, chan-ai), vitest for tests')
  })
})

describe('hasContextSection / isContextEmpty', () => {
  it('detects absence of markers', () => {
    expect(hasContextSection(CODE_MD_HEADING)).toBe(false)
    expect(isContextEmpty(CODE_MD_HEADING)).toBe(true)
  })

  it('detects a populated section as present and non-empty', () => {
    const content = CODE_MD_HEADING + formatContextSection(sampleContext)
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(false)
  })

  it('detects an all-empty inspection response as empty', () => {
    const content = CODE_MD_HEADING + formatContextSection(emptyContext)
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(true)
  })

  it('treats markers with no body as empty', () => {
    const content = `${CODE_MD_HEADING}${CONTEXT_START_MARKER}\n${CONTEXT_END_MARKER}\n`
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(true)
  })
})

describe('writeContextSection', () => {
  it('creates the file with heading + context section on a fresh repo', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })

    const content = await readFile(codeMdPath(cwd), 'utf8')
    expect(content.startsWith('# Code Knowledge Base')).toBe(true)
    expect(content.indexOf(CONTEXT_START_MARKER)).toBeGreaterThan(0)
    expect(content).toContain('- **Description:** A changelog management tool with an AI layer.')
  })

  it('creates the directory and file when .chan/ does not exist', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })

    const content = await readFile(codeMdPath(cwd), 'utf8')
    expect(content).toContain(CONTEXT_START_MARKER)
  })

  it('inserts the section after the heading on an existing knowledge base without markers', async () => {
    const cwd = tempDir()
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })
    const before = await readFile(codeMdPath(cwd), 'utf8')

    await writeContextSection({ cwd, context: sampleContext })

    const after = await readFile(codeMdPath(cwd), 'utf8')
    // the section sits between heading and the first commit entry
    const headingEnd = after.indexOf('## Commit 0123456')
    const sectionStart = after.indexOf(CONTEXT_START_MARKER)
    const sectionEnd = after.indexOf(CONTEXT_END_MARKER)
    expect(sectionStart).toBeGreaterThan(after.indexOf('# Code Knowledge Base'))
    expect(sectionEnd).toBeLessThan(headingEnd)
    // existing entries are untouched
    expect(after.slice(headingEnd)).toBe(before.slice(before.indexOf('## Commit 0123456')))
  })

  it('is a no-op when a populated context already exists', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })
    const before = await readFile(codeMdPath(cwd), 'utf8')

    const other = { ...sampleContext, description: 'Something else entirely.' }
    await writeContextSection({ cwd, context: other })

    const after = await readFile(codeMdPath(cwd), 'utf8')
    expect(after).toBe(before)
  })

  it('refills an empty context section', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: emptyContext })
    expect(isContextEmpty(await readFile(codeMdPath(cwd), 'utf8'))).toBe(true)

    await writeContextSection({ cwd, context: sampleContext })

    const after = await readFile(codeMdPath(cwd), 'utf8')
    expect(isContextEmpty(after)).toBe(false)
    expect(after).toContain('- **Description:** A changelog management tool with an AI layer.')
  })

  it('refills an empty section without disturbing following entries', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: emptyContext })
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })

    await writeContextSection({ cwd, context: sampleContext })

    const after = await readFile(codeMdPath(cwd), 'utf8')
    expect(after).toContain('- **Description:** A changelog management tool with an AI layer.')
    expect(after).toContain('## Commit 0123456')
    expect(after.indexOf(CONTEXT_END_MARKER)).toBeLessThan(after.indexOf('## Commit 0123456'))
  })

  it('does not rewrite a populated context even when entries were appended after it', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })
    const before = await readFile(codeMdPath(cwd), 'utf8')

    await writeContextSection({ cwd, context: emptyContext })

    const after = await readFile(codeMdPath(cwd), 'utf8')
    expect(after).toBe(before)
  })
})

describe('readContextSection', () => {
  it('returns the text between markers', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })

    const section = await readContextSection(cwd)
    expect(section).toContain('## Context')
    expect(section).toContain('- **Description:** A changelog management tool with an AI layer.')
    expect(section).not.toContain(CONTEXT_START_MARKER)
    expect(section).not.toContain(CONTEXT_END_MARKER)
  })

  it('returns an empty string when the section is absent', async () => {
    const cwd = tempDir()
    await initCodeMd(cwd)

    expect(await readContextSection(cwd)).toBe('')
  })

  it('returns an empty string when no knowledge base exists', async () => {
    const cwd = tempDir()
    expect(await readContextSection(cwd)).toBe('')
  })
})

describe('context section interactions', () => {
  it('appendEntries appends after the context section without disturbing it', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })
    const contextBefore = await readContextSection(cwd)

    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })

    const content = await readFile(codeMdPath(cwd), 'utf8')
    expect(await readContextSection(cwd)).toBe(contextBefore)
    expect(content.indexOf('## Commit 0123456')).toBeGreaterThan(content.indexOf(CONTEXT_END_MARKER))
  })

  it('commitsSinceLastAction ignores the context section', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })

    const shas = await commitsSinceLastAction(cwd)
    expect(shas).toEqual(['0123456'])
  })

  it('scanBreakingChanges is unaffected by the context section', async () => {
    const cwd = tempDir()
    await writeContextSection({ cwd, context: sampleContext })
    await appendEntries({ cwd, entries: [formatEntry({ meta: rawMeta })] })

    const findings = await scanBreakingChanges(cwd)
    expect(findings).toHaveLength(0)
  })
})
