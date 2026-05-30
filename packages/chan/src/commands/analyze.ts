import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createLogger } from '../logger.js'
import { createAnalyzer } from '@geut/chan-ai'

export const command = 'analyze'
export const description = 'Analyze commits and update code.md file.'

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
    describe: 'Auto analyze latest commits (HEAD only)',
    type: 'boolean',
    default: false,
  },
  aiProvider: {
    describe: 'AI provider',
    type: 'string',
    default: 'openai',
  },
  aiModel: {
    describe: 'AI model',
    type: 'string',
    default: 'gpt-5.5',
  },
  aiMaxTokens: {
    describe: 'Maximum tokens for the AI model',
    type: 'number',
    default: 500,
  },
  aiEndpoint: {
    describe: 'AI endpoint',
    type: 'string',
    default: undefined,
  },
  aiIncludeRaw: {
    describe: 'Include raw AI response',
    type: 'boolean',
    default: false,
  },
}

interface AnalyzeArgs {
  verbose?: boolean
  gitSha?: string
  auto?: boolean
  aiProvider?: string
  aiModel?: string
  aiMaxTokens?: number
  aiEndpoint?: string
  aiIncludeRaw?: boolean
}

export async function handler({
  verbose,
  gitSha,
  auto,
  aiProvider,
  aiModel,
  aiMaxTokens,
  aiEndpoint,
  aiIncludeRaw,
}: AnalyzeArgs) {
  const { info } = createLogger({ scope: 'analyze', verbose })

  if (!aiProvider || !aiModel) {
    info('AI provider or model is not configured, skipping analysis...')
    return
  }

  const aiContext = (await readFile(join(process.cwd(), '.chan', 'context.md'), 'utf8')) || ''

  const analyzer = createAnalyzer({
    provider: aiProvider,
    model: aiModel,
    context: aiContext,
    maxTokens: aiMaxTokens,
    baseUrl: aiEndpoint,
    includeRaw: aiIncludeRaw,
  })

  if (gitSha) {
    info(`Analyzing commit SHA ${gitSha} and updating code.md file...`)

    // call enrichFn with commit
    const enrichedCommit = await analyzer({
      commitShas: [gitSha],
      cwd: process.cwd(),
    })
    console.log(enrichedCommit)
  }

  if (auto) {
    info(`Analyzing latest commits and updating code.md file...`)
    // get latest commits
    // const commits = await getLatestCommits()
    // call enrichFn with commits
    // const enrichedCommits = await enrichFn(commits)
  }
}