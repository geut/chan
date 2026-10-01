import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, beforeAll } from 'vitest'
import { createAnalyzer } from '../../src/index.js'
import { CommitAnalysisResponseSchema } from '../../src/types.js'
import { handler as initHandler } from '../../../chan/src/commands/init.js'
import {
  CONTEXT_END_MARKER,
  CONTEXT_START_MARKER,
  codeMdPath,
  hasContextSection,
  isContextEmpty,
  readContextSection,
} from '../../../chan/src/code-md.js'

import { createTempGitRepo, type TempRepo } from './fixtures.js'

// Set OPENCODE_API_KEY or OPENAI_API_KEY to run e2e tests
const hasApiKey = process.env.OPENCODE_API_KEY || process.env.OPENAI_API_KEY
const describeOrSkip = hasApiKey ? describe : describe.skip

const testProvider = process.env.TEST_PROVIDER ?? 'opencode-go'
const testModel = process.env.TEST_MODEL ?? 'kimi-k2.7-code'
const testEndpoint = 'https://opencode.ai/zen/go/v1'

// Quick diagnostic: run this to see all available models from your provider
// npx vitest run tests/e2e/index.test.ts -t "list models"
describeOrSkip('analyze e2e', () => {
  let repo: TempRepo
  let analyzer: ReturnType<typeof createAnalyzer>

  beforeAll(async () => {
    repo = createTempGitRepo()
    // const context = `This is a module exports math functions`

    // NOTE: Model IDs must match exactly what your provider catalog lists.
    // For opencode, common patterns are:
    //   - kimi-k2.6, kimi-k2.5
    //   - gpt-4o, gpt-4o-mini
    //   - claude-sonnet-4, claude-opus-4
    //   - gemini-2.5-pro (NO "google/" prefix on opencode — that's OpenRouter style)
    //
    // WARNING: opencode may list a model but return "No provider available" if the
    // upstream (Google, Anthropic, etc.) is down or rate-limited. This is NOT a code
    // bug — try a different model or retry later.
    // Run the "list models" test below to discover exact names.
    analyzer = createAnalyzer({
      provider: testProvider,
      model: testModel,
      baseUrl: testEndpoint,
    })
  })

  it('should analyze commits', async () => {
    const result = await analyzer({
      commitShas: repo.commits,
      cwd: repo.dir,
    })

    expect(result).toHaveLength(3)
    expect(CommitAnalysisResponseSchema.parse(result[0].parsed)).toBeTruthy()
    expect(result[0].parsed.sha).toBe(repo.commits[0].slice(0, 7))
    expect(result[0].parsed.analysis).toBeDefined()
    expect(result[0].parsed.breakingChange).toBe(false)

    expect(CommitAnalysisResponseSchema.parse(result[1].parsed)).toBeTruthy()

    expect(result[1].parsed.sha).toBe(repo.commits[1].slice(0, 7))
    expect(result[1].parsed.analysis).toBeDefined()
    expect(result[1].parsed.breakingChange).toBe(false)

    expect(CommitAnalysisResponseSchema.parse(result[2].parsed)).toBeTruthy()
    expect(result[2].parsed.sha).toBe(repo.commits[2].slice(0, 7))
    expect(result[2].parsed.analysis).toBeDefined()

    if (result[2].parsed.breakingConfidence <= 0.3) {
      expect(result[2].parsed.breakingChange).toBe(false)
    }
    if (result[2].parsed.breakingConfidence >= 0.8) {
      expect(result[2].parsed.breakingChange).toBe(true)
    }
  })
})

describeOrSkip('init e2e', () => {
  let repo: TempRepo

  beforeAll(() => {
    repo = createTempGitRepo()
  })

  it('chan init with AI writes a populated Context section grounded in the README', async () => {
    await initHandler({
      dir: repo.dir,
      verbose: false,
      overwrite: false,
      aiProvider: testProvider,
      aiModel: testModel,
      aiEndpoint: testEndpoint,
    })

    await expect(access(join(repo.dir, 'CHANGELOG.md'))).resolves.toBeUndefined()

    const content = await readFile(codeMdPath(repo.dir), 'utf8')
    
    expect(content.startsWith('# Code Knowledge Base')).toBe(true)
    expect(hasContextSection(content)).toBe(true)
    expect(isContextEmpty(content)).toBe(false)

    const start = content.indexOf(CONTEXT_START_MARKER)
    const end = content.indexOf(CONTEXT_END_MARKER)
    const marked = content.slice(start, end + CONTEXT_END_MARKER.length)
    expect(marked).toContain('## Context')

    const section = await readContextSection(repo.dir)
    expect(section).toMatch(/tiny-math|add|node/i)
  })
})