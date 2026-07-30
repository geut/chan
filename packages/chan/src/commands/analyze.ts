import { createAnalyzer, type CommitAnalysisResponse, type Provider } from '@geut/chan-ai'

import { createLogger } from '../logger.js'
import { loadConfig } from '../config.js'
import { getCommitLog, getCommitMetadata, getHeadSha } from '../git.js'
import { appendEntries, formatEntry } from '../code-md.js'

export const command = 'analyze'
export const description = 'Analyze commits and append structured entries to .chan/code.md.'

export const builder = {
  verbose: {
    alias: 'v',
    describe: 'Verbose output',
    type: 'boolean',
    default: false,
  },
  gitSha: {
    describe: 'Git SHA to analyze',
    type: 'string',
  },
  auto: {
    describe: 'Auto analyze HEAD only (fast path used by the post-commit hook)',
    type: 'boolean',
    default: false,
  },
  limit: {
    describe: 'Max number of commits to read from git log',
    type: 'number',
    default: 50,
  },
  aiProvider: {
    describe: 'AI provider (overrides .chanrc ai.provider)',
    type: 'string',
  },
  aiModel: {
    describe: 'AI model (overrides .chanrc ai.model)',
    type: 'string',
  },
  aiMaxTokens: {
    describe: 'Maximum tokens for the AI model (overrides .chanrc ai.maxTokens)',
    type: 'number',
  },
  aiEndpoint: {
    describe: 'AI endpoint / baseUrl (overrides .chanrc ai.endpoint)',
    type: 'string',
  },
}

interface AnalyzeArgs {
  verbose?: boolean
  gitSha?: string
  auto?: boolean
  limit?: number
  aiProvider?: string
  aiModel?: string
  aiMaxTokens?: number
  aiEndpoint?: string
}

interface AiResolvedConfig {
  provider: string | Provider
  model: string
  maxTokens?: number
  baseUrl?: string
}

export interface RunAnalyzeOptions {
  cwd: string
  commitShas: string[]
  ai?: AiResolvedConfig
}

export async function runAnalyze({ cwd, commitShas, ai }: RunAnalyzeOptions): Promise<number> {
  const metas = await Promise.all(commitShas.map(sha => getCommitMetadata(sha, cwd)))

  let analyses: (CommitAnalysisResponse | undefined)[] = metas.map(() => undefined)

  if (ai) {
    const analyzer = createAnalyzer({
      provider: ai.provider,
      model: ai.model,
      maxTokens: ai.maxTokens,
      baseUrl: ai.baseUrl,
    })
    const results = await analyzer({ commitShas, cwd })
    analyses = results.map(r => r.parsed)
  }

  const entries = metas.map((meta, index) => formatEntry({ meta, analysis: analyses[index] }))

  await appendEntries({ cwd, entries })

  return entries.length
}

export async function handler(args: AnalyzeArgs) {
  const { verbose, gitSha, auto, limit = 50, aiProvider, aiModel, aiMaxTokens, aiEndpoint } = args

  const cwd = process.cwd()
  const { info, success } = createLogger({ scope: 'analyze', verbose })

  const config = loadConfig()
  const provider = aiProvider ?? config.ai?.provider
  const model = aiModel ?? config.ai?.model
  const hasAI = Boolean(provider && model)

  let commitShas: string[]
  if (gitSha) {
    commitShas = [gitSha]
  } else if (auto) {
    commitShas = [await getHeadSha(cwd)]
  } else {
    commitShas = await getCommitLog(cwd, { limit })
  }

  if (commitShas.length === 0) {
    info('No commits to analyze.')
    return
  }

  const ai: AiResolvedConfig | undefined = hasAI
    ? {
        provider: provider as string | Provider,
        model: model!,
        maxTokens: aiMaxTokens ?? config.ai?.maxTokens,
        baseUrl: aiEndpoint ?? config.ai?.endpoint,
      }
    : undefined

  if (ai) {
    info(`Analyzing ${commitShas.length} commit(s) with (${provider}/${model})...`)
  } else {
    info('AI not configured, storing raw commit metadata without synthesis.')
  }

  const count = await runAnalyze({ cwd, commitShas, ai })

  success(`Appended ${count} entr${count === 1 ? 'y' : 'ies'} to .chan/code.md.`)
}