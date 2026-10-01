import { resolve } from 'node:path'
import boxen from 'boxen'
import { promises as fs } from 'node:fs'

import { initialize } from '@geut/chan-core'

import { createLogger, type ChanLogger } from '../logger.js'
import { read, write } from '../vfs.js'
import {
  initCodeMd,
  readCodeMd,
  hasContextSection,
  isContextEmpty,
  writeContextSection,
  type CodeBaseContext,
} from '../code-md.js'
import { buildCodebaseSnapshot } from '../codebase-snapshot.js'
import { resolveAiConfig, createInspectorFromConfig, type AiResolvedConfig } from '../ai-config.js'

export const command = 'init [dir]'
export const description = 'Initialize CHANGELOG.md file'

export const builder = {
  dir: {
    alias: ['p', 'path'],
    default: '.'
  },
  overwrite: {
    alias: 'o',
    describe: 'Overwrite the current CHANGELOG.md',
    type: 'boolean' as const,
    default: false
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

interface InitArgs {
  dir: string
  overwrite: boolean
  verbose?: boolean
  stdout?: boolean
  aiProvider?: string
  aiModel?: string
  aiMaxTokens?: number
  aiEndpoint?: string
}

export interface RunInitContextOptions {
  cwd: string
  ai?: AiResolvedConfig
  logger: ChanLogger
}

// Context generation flow for `chan init`: Codebase Snapshot → Inspection →
// writeContextSection. Exported seam (mirroring runAnalyze) so tests inject a
// Provider instance directly — string flags cannot carry one. Every AI
// failure mode degrades to a hint/warning: init must always keep succeeding
// (logger.error/fatal set process.exitCode = 1 and are never used here).
export async function runInitContext({ cwd, ai, logger }: RunInitContextOptions): Promise<void> {
  if (!ai) {
    logger.info(
      'AI is not configured — set ai.provider and ai.model in .chanrc (or pass --ai-provider/--ai-model) to generate a Context section'
    )
    return
  }

  // Re-run guard (ADR-0001 + cost): a populated Context means this is a re-run
  // whose inspection result would be discarded anyway — skip the AI call.
  const existing = await readCodeMd(cwd)
  if (hasContextSection(existing) && !isContextEmpty(existing)) return

  logger.info('Inspecting codebase with AI to generate the Context section...')

  let context: CodeBaseContext
  try {
    const codebaseSnapshot = await buildCodebaseSnapshot(cwd)
    const inspector = createInspectorFromConfig(ai)
    const result = await inspector({ codebaseSnapshot })
    context = result.parsed
  } catch (err) {
    logger.warn(`Context generation failed: ${(err as Error).message}`)
    return
  }

  await writeContextSection({ cwd, context })

  const allEmpty =
    context.description === '' &&
    context.usage === '' &&
    context.runtimes.length === 0 &&
    context.projectTypes.length === 0 &&
    context.requirements.length === 0 &&
    context.notes.length === 0

  if (allEmpty) {
    logger.warn(
      'The generated Context section is empty. Re-run `chan init` to populate it.'
    )
  } else {
    logger.success('Context section generated in .chan/code.md.')
  }
}

export async function handler ({ dir, overwrite, verbose, stdout, aiProvider, aiModel, aiMaxTokens, aiEndpoint }: InitArgs) {
  const logger = createLogger({ scope: 'init', verbose, stdout })
  const { report, success, info } = logger

  try {
    const file = await read(resolve(dir, 'CHANGELOG.md'))

    await initialize(file, { overwrite: overwrite || stdout })

    await write({ file, stdout })

    report(file)
  } catch (err) {
    return report(err as Error)
  }

  success('CHANGELOG.md created.')

  try {
    await initCodeMd(resolve(dir))
    info('Created .chan/code.md knowledge base.')
  } catch (err) {
    return report(err as Error)
  }

  // CHANGELOG.md and the starter code.md are already safe on disk — from here
  // on, AI failures degrade to warnings and never fail init.
  const ai = resolveAiConfig({ aiProvider, aiModel, aiMaxTokens, aiEndpoint })
  await runInitContext({ cwd: resolve(dir), ai, logger })

  try {
    await fs.access(resolve(dir, 'package.json'))
    info('Update the npm script `version` in your package.json to release automatically:')
    console.log(boxen('chan release ${npm_package_version} && git add .', { padding: 1, float: 'center' })) // eslint-disable-line no-template-curly-in-string
  } catch {
    // ignore
  }
}
