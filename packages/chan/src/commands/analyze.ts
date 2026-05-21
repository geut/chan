import { createLogger } from '../logger.js'
import { analyze } from '@geut/chan-ai'

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
}

interface AnalyzeArgs {
  verbose?: boolean
  gitSha?: string
  auto?: boolean
  aiProvider?: string
  aiModel?: string
}

export async function handler({ verbose, gitSha, auto, aiProvider, aiModel }: AnalyzeArgs) {
  const { info } = createLogger({ scope: 'analyze', verbose })

  if (!aiProvider || !aiModel) {
    info('AI provider or model is not configured, skipping analysis...')
    return
  }

  if (gitSha) {
    info(`Analyzing commit SHA ${gitSha} and updating code.md file...`)

    // call enrichFn with commit
    const enrichedCommit = await analyze({
      commitShas: [gitSha as string],
      provider: aiProvider as string,
      model: aiModel as string,
      cwd: process.cwd(),
    })
    console.log(enrichedCommit)
  }

  if (auto) {
    info(`Analyzing latest commits  and updating code.md file...`)
    // get latest commits
    // const commits = await getLatestCommits()
    // call enrichFn with commits
    // const enrichedCommits = await enrichFn(commits)
  }
}