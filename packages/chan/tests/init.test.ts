import { stat, readFile } from 'node:fs/promises'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import * as init from '../src/commands/init.js'
import { handler, runInitContext } from '../src/commands/init.js'
import * as analyze from '../src/commands/analyze.js'
import { MockProvider, type ProjectInspectionResponse, type Provider } from '@geut/chan-ai'
import {
  codeMdPath,
  hasContextSection,
  isContextEmpty,
  readContextSection,
} from '../src/code-md.js'

const mockInspection: ProjectInspectionResponse = {
  description: 'Changelog management tool with an AI layer.',
  usage: 'npx chan init; npx chan analyze',
  runtimes: ['node'],
  projectTypes: ['monorepo'],
  requirements: ['Node >= 20'],
  notes: ['vitest test runner'],
}

const emptyInspection: ProjectInspectionResponse = {
  description: '',
  usage: '',
  runtimes: [],
  projectTypes: [],
  requirements: [],
  notes: [],
}

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'chan-init-'))
}

function seedCodeMd(dir: string, body: string): void {
  mkdirSync(join(dir, '.chan'), { recursive: true })
  writeFileSync(codeMdPath(dir), body)
}

interface StubCalls {
  info: string[]
  success: string[]
  warn: string[]
}

function stubLogger(): { calls: StubCalls; logger: { info: (m: string) => void; success: (m: string) => void; warn: (m: string) => void } } {
  const calls: StubCalls = { info: [], success: [], warn: [] }
  return {
    calls,
    logger: {
      info: m => {
        calls.info.push(m)
      },
      success: m => {
        calls.success.push(m)
      },
      warn: m => {
        calls.warn.push(m)
      },
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('init', () => {
  it('exports yarg command structure', () => {
    expect(init.command).toMatch(/init/)
    expect(init.description).toBeDefined()

    expect(init.builder).toBeDefined()
    expect(init.builder).toHaveProperty('dir')
    expect(init.builder).toHaveProperty('overwrite')

    expect(init.handler).toBeDefined()
  })

  it('exposes the AI override flags with the same shapes as analyze', () => {
    for (const flag of ['aiProvider', 'aiModel', 'aiMaxTokens', 'aiEndpoint'] as const) {
      expect(init.builder).toHaveProperty(flag)
      expect(init.builder[flag]).toEqual(analyze.builder[flag])
    }
  })

  it('creates the .chan/ directory and starter code.md', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'chan-init-'))
    await handler({ dir, overwrite: false })

    const codeMdStat = await stat(join(dir, '.chan', 'code.md'))
    expect(codeMdStat.isFile()).toBe(true)
  })

  it('without AI config: creates CHANGELOG.md + starter code.md (no markers) and logs the AI hint', async () => {
    const dir = tempDir()

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    await handler({ dir, overwrite: false })
    const written = stdoutSpy.mock.calls.map(callArgs => String(callArgs[0])).join('\n')
    stdoutSpy.mockRestore()

    const changelog = await readFile(join(dir, 'CHANGELOG.md'), 'utf8')
    expect(changelog).toContain('# Changelog')

    const content = await readFile(codeMdPath(dir), 'utf8')
    expect(content).toContain('# Code Knowledge Base')
    expect(hasContextSection(content)).toBe(false)

    expect(written).toContain('AI is not configured')
  })
})

describe('runInitContext (no AI)', () => {
  it('logs the configuration hint and writes no Context', async () => {
    const dir = tempDir()
    const { calls, logger } = stubLogger()

    await runInitContext({ cwd: dir, logger })

    expect(calls.info).toContain(
      'AI is not configured — set ai.provider and ai.model in .chanrc (or pass --ai-provider/--ai-model) to generate a Context section'
    )
    expect(calls.warn).toHaveLength(0)
    expect(calls.success).toHaveLength(0)

    // No knowledge base was touched by the flow itself.
    await expect(readFile(codeMdPath(dir), 'utf8')).rejects.toThrow()
  })
})

describe('runInitContext (AI via MockProvider)', () => {
  it('writes a populated Context section after the heading, with the snapshot delivered to the inspector', async () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'a.ts'), 'export const x = 1\n')
    const { calls, logger } = stubLogger()

    const invokeSpy = vi.spyOn(MockProvider.prototype, 'invoke')
    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(mockInspection), model: 'mockModel' },
      logger,
    })

    // The AI was called exactly once, with the codebase snapshot embedded.
    expect(invokeSpy).toHaveBeenCalledTimes(1)
    const userMessage = invokeSpy.mock.calls[0]?.[0]?.[1]?.content
    expect(userMessage).toContain('a.ts')

    const content = await readFile(codeMdPath(dir), 'utf8')
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(false)

    const section = await readContextSection(dir)
    expect(section).toContain('**Description:** Changelog management tool with an AI layer.')
    expect(section).toContain('**Runtimes:** node')

    expect(calls.success).toContain('Context section generated in .chan/code.md.')
    expect(calls.warn).toHaveLength(0)
  })

  it('inserts the Context before existing entries and leaves them untouched', async () => {
    const dir = tempDir()
    const entry = '## Commit abc1234\n\n- **Author:** T <t@t.com>\n\n'
    seedCodeMd(dir, `# Code Knowledge Base\n\n${entry}`)
    const { logger } = stubLogger()

    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(mockInspection), model: 'mockModel' },
      logger,
    })

    const content = await readFile(codeMdPath(dir), 'utf8')
    expect(content).toContain(entry)
    expect(content.indexOf('## Context')).toBeLessThan(content.indexOf('## Commit abc1234'))
    expect(hasContextSection(content)).toBe(true)
  })

  it('warns and leaves the knowledge base untouched when the inspector throws', async () => {
    const dir = tempDir()
    const before = '# Code Knowledge Base\n\n## Commit abc1234\n\n- **Author:** T\n\n'
    seedCodeMd(dir, before)
    const { calls, logger } = stubLogger()

    const throwingProvider: Provider = {
      invoke: async () => {
        throw new Error('Missing API key')
      },
    }

    await runInitContext({ cwd: dir, ai: { provider: throwingProvider, model: 'mockModel' }, logger })

    expect(calls.warn.join('\n')).toContain('Missing API key')
    expect(calls.success).toHaveLength(0)

    // AI failure must never fail init: no error path (which would set the
    // process exit code) and the file is byte-identical.
    expect(process.exitCode).toBeUndefined()
    const after = await readFile(codeMdPath(dir), 'utf8')
    expect(after).toBe(before)
  })

  it('writes the empty marker section and warns about re-run when the inspection is all-empty', async () => {
    const dir = tempDir()
    const { calls, logger } = stubLogger()

    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(emptyInspection), model: 'mockModel' },
      logger,
    })

    const content = await readFile(codeMdPath(dir), 'utf8')
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(true)

    expect(calls.warn.join('\n')).toMatch(/re-run/i)
    expect(calls.success).toHaveLength(0)
  })

  it('re-run on a populated Context performs no AI call and leaves the file byte-identical', async () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'a.ts'), 'export const x = 1\n')
    const { logger: firstLogger } = stubLogger()
    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(mockInspection), model: 'mockModel' },
      logger: firstLogger,
    })
    const before = await readFile(codeMdPath(dir), 'utf8')

    const invokeSpy = vi.spyOn(MockProvider.prototype, 'invoke')
    const { logger } = stubLogger()
    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(mockInspection), model: 'mockModel' },
      logger,
    })

    // Cost guard: the populated Context short-circuits before any AI call.
    expect(invokeSpy).not.toHaveBeenCalled()
    const after = await readFile(codeMdPath(dir), 'utf8')
    expect(after).toBe(before)
  })

  it('re-run on an empty Context refills it and leaves entries untouched', async () => {
    const dir = tempDir()
    const entry = '## Commit abc1234\n\n- **Author:** T <t@t.com>\n\n'
    seedCodeMd(dir, `# Code Knowledge Base\n\n${entry}`)

    // First run stores an all-empty section (re-runnable state).
    const { logger: firstLogger } = stubLogger()
    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(emptyInspection), model: 'mockModel' },
      logger: firstLogger,
    })

    // Second run with a real response refills the same marker block.
    const { logger } = stubLogger()
    await runInitContext({
      cwd: dir,
      ai: { provider: new MockProvider(mockInspection), model: 'mockModel' },
      logger,
    })

    const content = await readFile(codeMdPath(dir), 'utf8')
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(false)
    expect(content).toContain(entry)

    // Exactly one Context block: markers replaced, not duplicated.
    expect(content.match(/chan:context:start/g)).toHaveLength(1)
    expect(content.match(/chan:context:end/g)).toHaveLength(1)
  })
})
