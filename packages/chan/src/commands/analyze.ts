import { createAnalyzer, type CommitAnalysisResponse, type Provider } from '@geut/chan-ai'

import { createLogger } from '../logger.js'
import { getCommitLog, getCommitMetadata, getHeadSha } from '../git.js'
import { appendEntries, formatEntry } from '../code-md.js'
import {
  resolveAiConfig,
  createAnalyzerFromConfig,
  type AiResolvedConfig,
} from '../ai-config.js'

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
    describe: 'Git SHA to analyze (defaults to HEAD)',
    type: 'string',
  },
  commits: {
    describe: 'Comma-separated list of commit SHAs to analyze',
    type: 'string',
  },
  limit: {
    describe: 'Max number of commits to read from git log (used when no gitSha/commits given and you want a range). Set to 1 to analyze only HEAD.',
    type: 'number',
    default: 1,
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
  commits?: string
  limit?: number
  aiProvider?: string
  aiModel?: string
  aiMaxTokens?: number
  aiEndpoint?: string
}

export interface RunAnalyzeOptions {
  cwd: string
  commitShas: string[]
  ai?: AiResolvedConfig
}

export async function runAnalyze({
  cwd,
  commitShas,
  ai,
}: RunAnalyzeOptions): Promise<number> {
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

  const entries = metas.map((meta, index) =>
    formatEntry({ meta, analysis: analyses[index] })
  )

  await appendEntries({ cwd, entries })

  return entries.length
}

export async function handler(args: AnalyzeArgs) {
  const {
    verbose,
    gitSha,
    commits,
    limit = 1,
    aiProvider,
    aiModel,
    aiMaxTokens,
    aiEndpoint,
  } = args

  const cwd = process.cwd()
  const { info, success } = createLogger({ scope: 'analyze', verbose })

  const ai = resolveAiConfig({
    aiProvider,
    aiModel,
    aiMaxTokens,
    aiEndpoint,
  })

  if (!ai) {
    // `chan analyze` requires AI to be useful; without it there is nothing to
    // synthesize and we don't want to append raw noise to the knowledge base.
    info(
      'AI is not configured. Set ai.provider and ai.model in .chanrc (or pass --ai-provider/--ai-model) to analyze commits.'
    )
    return
  }

  let commitShas: string[]
  if (commits) {
    commitShas = commits
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  } else if (gitSha) {
    commitShas = [gitSha]
  } else {
    // Default: analyze HEAD (post-commit hook path). Use --limit to analyze a range.
    commitShas = await getCommitLog(cwd, { limit })
    if (commitShas.length === 0) {
      commitShas = [await getHeadSha(cwd)]
    }
  }

  if (commitShas.length === 0) {
    info('No commits to analyze.')
    return
  }

  info(`Analyzing ${commitShas.length} commit(s) with AI (${ai.provider}/${ai.model})...`)

  const count = await runAnalyze({ cwd, commitShas, ai })

  success(`Appended ${count} entr${count === 1 ? 'y' : 'ies'} to .chan/code.md.`)
}

// Re-export for external callers (e.g. tests / future github action wrapper).
export { createAnalyzerFromConfig, type AiResolvedConfig, type Provider }
