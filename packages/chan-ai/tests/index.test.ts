import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { MockProvider } from '../src/providers/mock.js'
import { createTempGitRepo } from './e2e/fixtures.js'

import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as chanAI from '../src/index.js'
import { CATEGORIES, CommitAnalysisResponseSchema, ActionAugmentationResponseSchema, ProjectInspectionResponseSchema, InspectArgsSchema, CHAN_ACTIONS } from '../src/types.js'

const mockResponse = {
  sha: 'abc123',
  analysis: 'This is a test response.',
  author: 'User',
  authorEmail: 'user@example.com',
  coauthors: ['user2', 'user3'],
  date: '2026-05-04',
  category: 'Feature',
  breakingChange: false,
  breakingDetails: '',
  breakingConfidence: 0.95,
  packagesAffected: ['package1', 'package2'],
  relatedCode: [''],
  relatedIssues: [''],
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim()
}

describe('getCommitsInfo unit test', () => {
  it('should get the commit info', async () => {
    const { commits, dir } = createTempGitRepo()
    const sha = commits[0] ?? ''

    const [info] = await chanAI.getCommitsInfo({
      commitShas: [sha],
      cwd: dir,
    })
    // format: %h, %s, Body:%b, %an (%ae), %aI, %p, then diff (-U0)
    const lines = (info ?? '').split('\n')

    expect(lines[0]).toBe(sha.slice(0, 7))
    expect(lines[1]).toBe('add function to add two numbers')
    expect(lines[2]).toBe('Body:')
    expect(lines[3]).toBe('Chan Test User (test@test.com)')
    expect(lines[4]).toMatch(/^\d{4}-\d{2}-\d{2}T/) // ISO date (%aI)
    expect(info).toContain('diff --git a/index.ts b/index.ts')
    expect(info).toContain('+export const add = (a: number, b: number) => a + b')
  })

  it('returns one entry per SHA in input order, including duplicates', async () => {
    const { commits, dir } = createTempGitRepo()
    const [first, second] = commits

    const infos = await chanAI.getCommitsInfo({
      commitShas: [second ?? '', first ?? '', second ?? ''],
      cwd: dir,
    })

    expect(infos).toHaveLength(3)
    expect(infos[0]?.split('\n')[0]).toBe((second ?? '').slice(0, 7))
    expect(infos[1]?.split('\n')[0]).toBe((first ?? '').slice(0, 7))
    expect(infos[2]?.split('\n')[0]).toBe((second ?? '').slice(0, 7))
  })

  it('should throw for an unknown commit', async () => {
    const repo = createTempGitRepo()
    await expect(
      chanAI.getCommitsInfo({
        commitShas: ['deadbeef'],
        cwd: repo.dir,
      })
    ).rejects.toThrow()
  })

  it('omits lockfile patch bodies and keeps source hunks', async () => {
    const { dir } = createTempGitRepo()
    const lockPath = join(dir, 'packages', 'app', 'pnpm-lock.yaml')
    const sentinel = 'integrity: sha512-LOCKFILE-SENTINEL-should-not-appear'
    mkdirSync(join(dir, 'packages', 'app'), { recursive: true })
    writeFileSync(lockPath, "lockfileVersion: '9.0'\nimporters: .\nold-line\n")
    git(['add', '.'], dir)
    git(['commit', '-m', 'add lockfile'], dir)

    writeFileSync(lockPath, `lockfileVersion: '9.0'\nimporters: .\nnew-line\n${sentinel}\n`)
    writeFileSync(
      join(dir, 'index.ts'),
      'export const add = (a: number, b: number) => a + b\nexport const sub = (a: number, b: number) => a - b\n'
    )
    git(['add', '.'], dir)
    git(['commit', '-m', 'tweak source and lockfile'], dir)
    const sha = git(['rev-parse', 'HEAD'], dir)

    const [info] = await chanAI.getCommitsInfo({ commitShas: [sha], cwd: dir })

    expect(info).toContain('diff --git a/index.ts b/index.ts')
    expect(info).toContain('+export const sub = (a: number, b: number) => a - b')
    expect(info).not.toContain(sentinel)
    expect(info).not.toContain('old-line')

    const lockSection = info
      ?.split(/^(?=diff --git )/m)
      .find(part => part.startsWith('diff --git a/packages/app/pnpm-lock.yaml'))
    expect(lockSection?.trim()).toBe(
      'diff --git a/packages/app/pnpm-lock.yaml b/packages/app/pnpm-lock.yaml\nlockfile omitted: +2/-1'
    )
  })

  it('omits .chan/code.md and CHANGELOG.md patches and keeps source hunks', async () => {
    const { dir } = createTempGitRepo()
    const codeMdSentinel = 'CODE-MD-SENTINEL-should-not-appear'
    const changelogSentinel = 'CHANGELOG-SENTINEL-should-not-appear'
    mkdirSync(join(dir, '.chan'), { recursive: true })
    writeFileSync(join(dir, '.chan', 'code.md'), `# Code Knowledge Base\n\n${codeMdSentinel}\n`)
    writeFileSync(join(dir, 'CHANGELOG.md'), `# Changelog\n\n${changelogSentinel}\n`)
    writeFileSync(
      join(dir, 'index.ts'),
      'export const add = (a: number, b: number) => a + b\nexport const sub = (a: number, b: number) => a - b\n'
    )
    git(['add', '.'], dir)
    git(['commit', '-m', 'feat: source plus chan artifacts'], dir)
    const sha = git(['rev-parse', 'HEAD'], dir)

    const [info] = await chanAI.getCommitsInfo({ commitShas: [sha], cwd: dir })

    expect(info).toContain('diff --git a/index.ts b/index.ts')
    expect(info).toContain('+export const sub = (a: number, b: number) => a - b')
    expect(info).not.toContain(codeMdSentinel)
    expect(info).not.toContain(changelogSentinel)
    expect(info).not.toContain('diff --git a/.chan/code.md')
    expect(info).not.toContain('diff --git a/CHANGELOG.md')
  })
})

describe('analyze unit test', () => {
  let analyzer: Function
  let mockProvider: MockProvider
  let invokeSpy: ReturnType<typeof vi.spyOn>
  const commitText = `abc123
feat: update code
Body:
User (user@example.com)
2026-05-04T00:00:00+00:00
`
  const getCommitsInfoTool = vi.fn().mockResolvedValue([commitText])

  beforeAll(async () => {
    mockProvider = new MockProvider(mockResponse)
    invokeSpy = vi.spyOn(mockProvider, 'invoke')

    analyzer = chanAI.createAnalyzer({
      provider: mockProvider,
      model: 'mockModel',
      tools: [getCommitsInfoTool],
    })
  })

  it('should throw an error if the provider is not supported', () => {
    expect(() => {
      chanAI.createAnalyzer({
        provider: 'invalidProvider',
        model: 'mockModel',
      })
    }).toThrow('Provider invalidProvider is not supported')
  })

  it('should analyze commits', async () => {
    const result = await analyzer({
      commitShas: ['abc123'],
      cwd: process.cwd(),
    })

    expect(getCommitsInfoTool).toHaveBeenCalledWith({
      commitShas: ['abc123'],
      cwd: process.cwd(),
    })
    expect(getCommitsInfoTool).toHaveBeenCalledTimes(1)
    expect(invokeSpy).toHaveBeenCalledTimes(1)

    // validate the response with the schema
    expect(CommitAnalysisResponseSchema.parse(result[0].parsed)).toBeTruthy()

    expect(result[0].parsed.analysis).toBeDefined()
    expect(result[0].parsed.author).toBe('User')
    expect(result[0].parsed.date).toBe('2026-05-04')
    expect(CATEGORIES.includes(result[0].parsed.category)).toBe(true)
    expect(result[0].parsed.breakingChange).toBeTypeOf('boolean')
  })

  it('calls the tool once for the batch and the model once per commit', async () => {
    const tool = vi.fn().mockResolvedValue(['first commit', 'second commit'])
    const provider = new MockProvider(mockResponse)
    const invoke = vi.spyOn(provider, 'invoke')
    const batchAnalyzer = chanAI.createAnalyzer({
      provider,
      model: 'mockModel',
      tools: [tool],
    })

    const result = await batchAnalyzer({
      commitShas: ['aaa', 'bbb'],
      cwd: process.cwd(),
    })

    expect(tool).toHaveBeenCalledTimes(1)
    expect(tool).toHaveBeenCalledWith({ commitShas: ['aaa', 'bbb'], cwd: process.cwd() })
    expect(invoke).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    const firstCall = invoke.mock.calls[0]?.[0]
    const secondCall = invoke.mock.calls[1]?.[0]
    expect(firstCall?.find(message => message.role === 'user')?.content).toContain('first commit')
    expect(secondCall?.find(message => message.role === 'user')?.content).toContain('second commit')
  })
})

describe('augment unit test', () => {
  const mockAugmentResponse = {
    action: 'added',
    message: 'Add multiply function to the math module',
    classification: ['Feature'],
    linkedShas: ['abc123', 'def456'],
    breakingChange: false,
    breakingDetails: '',
    confidence: 0.9
  }

  it('createAugmenter throws for an unsupported provider', () => {
    expect(() =>
      chanAI.createAugmenter({
        provider: 'invalidProvider',
        model: 'mockModel'
      })
    ).toThrow('Provider invalidProvider is not supported')
  })

  it('augments commits into a keepachangelog entry, preserving the precise classification', async () => {
    const mockProvider = new MockProvider(mockAugmentResponse)
    const invokeSpy = vi.spyOn(mockProvider, 'invoke')

    const augment = chanAI.createAugmenter({
      provider: mockProvider,
      model: 'mockModel'
    })

    const result = await augment({
      commitShas: ['abc123', 'def456'],
      codeMdContext: '## Commit abc123\n- **Analysis:** adds multiply'
    })

    expect(invokeSpy).toHaveBeenCalledTimes(1)
    expect(ActionAugmentationResponseSchema.parse(result.parsed)).toBeTruthy()
    expect(CHAN_ACTIONS.includes(result.parsed.action)).toBe(true)
    expect(result.parsed.message).toBe('Add multiply function to the math module')
    expect(result.parsed.classification).toEqual(['Feature'])
    expect(result.parsed.linkedShas).toEqual(['abc123', 'def456'])
    expect(result.parsed.breakingChange).toBe(false)
  })

  it('augments without a user message (infers it)', async () => {
    const mockProvider = new MockProvider(mockAugmentResponse)
    const augment = chanAI.createAugmenter({ provider: mockProvider, model: 'mockModel' })

    const result = await augment({
      commitShas: ['abc123']
    })

    expect(result.parsed.message).toBeDefined()
    expect(result.parsed.action).toBe('added')
  })
})

describe('inspect unit test', () => {
  const codebaseSnapshot = [
    '# Codebase Snapshot',
    '',
    '## package.json',
    '{"name": "@geut/chan", "engines": {"node": ">=20"}}',
    '',
    '## README (full)',
    'Chan is a changelog management tool with an optional AI layer.',
    '',
    '## Top-level directories',
    'packages/ docs/ scripts/',
  ].join('\n')

  const mockInspectResponse = {
    description: 'changelog management tool with optional AI layer',
    usage: 'npx chan init; npx chan analyze',
    runtimes: ['node', 'cli'],
    projectTypes: ['monorepo', 'cli tool'],
    requirements: ['Node >= 20', 'git'],
    notes: [],
  }

  it('createInspector throws for an unsupported provider', () => {
    expect(() =>
      chanAI.createInspector({
        provider: 'invalidProvider',
        model: 'mockModel',
      })
    ).toThrow('Provider invalidProvider is not supported')
  })

  it('inspects a codebase snapshot into a structured project summary', async () => {
    const mockProvider = new MockProvider(mockInspectResponse)
    const invokeSpy = vi.spyOn(mockProvider, 'invoke')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const inspect = chanAI.createInspector({
      provider: mockProvider,
      model: 'mockModel',
    })

    const result = await inspect({ codebaseSnapshot })

    expect(invokeSpy).toHaveBeenCalledTimes(1)
    const [[messages]] = invokeSpy.mock.calls
    const [systemMessage, userMessage] = messages
    expect(messages).toHaveLength(2)

    // system prompt first, with the hard rules
    expect(systemMessage.role).toBe('system')
    expect(systemMessage.content).toContain('Evidence discipline')
    expect(systemMessage.content).toContain('Terse, telegraphic style')

    // user message contains the snapshot verbatim
    expect(userMessage.role).toBe('user')
    expect(userMessage.content).toContain(codebaseSnapshot)

    // response conforms to the schema (empty notes = evidence discipline)
    expect(ProjectInspectionResponseSchema.parse(result.parsed)).toBeTruthy()
    expect(result.parsed.description).toBe('changelog management tool with optional AI layer')
    expect(result.parsed.usage).toBe('npx chan init; npx chan analyze')
    expect(result.parsed.runtimes).toEqual(['node', 'cli'])
    expect(result.parsed.projectTypes).toEqual(['monorepo', 'cli tool'])
    expect(result.parsed.requirements).toEqual(['Node >= 20', 'git'])
    expect(result.parsed.notes).toEqual([])

    // token usage is logged like the other factories
    expect(logSpy).toHaveBeenCalledWith('Inspect token usage: 0 (input: 0, output: 0)')
    logSpy.mockRestore()
  })

  it('accepts an all-empty inspection response (evidence over guessing)', async () => {
    const mockProvider = new MockProvider({
      description: '',
      usage: '',
      runtimes: [],
      projectTypes: [],
      requirements: [],
      notes: [],
    })
    const inspect = chanAI.createInspector({ provider: mockProvider, model: 'mockModel' })

    const result = await inspect({ codebaseSnapshot: '## package.json\n{}' })

    expect(ProjectInspectionResponseSchema.parse(result.parsed)).toBeTruthy()
    expect(result.parsed.description).toBe('')
    expect(result.parsed.runtimes).toEqual([])
  })

  it('exports InspectArgsSchema from the package root', () => {
    expect(InspectArgsSchema.parse({ codebaseSnapshot })).toEqual({ codebaseSnapshot })
  })
})

describe('ollama provider registration', () => {
  it('is a known first-class provider', () => {
    // createProvider would not throw for ollama because it is registered.
    const augment = chanAI.createAugmenter({
      provider: 'ollama',
      model: 'llama3.1'
    })
    expect(typeof augment).toBe('function')
  })
})