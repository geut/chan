import fs from 'node:fs'
import { findUpSync } from 'find-up'
import { z } from 'zod'

export const ConfigSchema = z.object({
  gitUrl: z.url().optional().describe('e.g. https://github.com/owner/repo.git'),
  releasePrefix: z.string().optional().describe('v, V, etc.'),
  gitCompareTemplate: z
    .string()
    .optional()
    .describe('https://github.com/ORG/REPO/compare/[prev]...[next]'),
  gitReleaseTemplate: z
    .string()
    .optional()
    .describe('https://github.com/ORG/REPO/releases/tag/[next]'),
  gitBranch: z.string().optional().describe('main, master, etc.'),
  allowYanked: z.boolean().optional().describe('allow yanked releases'),
  allowPrerelease: z.boolean().optional().describe('allow pre-releases'),
  mergePrerelease: z.boolean().optional().describe('merge pre-releases'),
  path: z.string().optional().describe('path to the changelog file'),
  ghRelease: z.boolean().optional().describe('github release'),
  ai: z
    .object({
      provider: z.string().optional().describe('openai, anthropic, etc.'),
      model: z.string().optional(),
      maxTokens: z.number().optional(),
      endpoint: z.string().optional(),
    })
    .optional(),
})

export type Config = z.infer<typeof ConfigSchema>

export const loadConfig = () => {
  const configPath = findUpSync(['.chanrc', '.chanrc.json'])

  if (!configPath) {
    return {}
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>

  const parsedConfig = ConfigSchema.safeParse(config)

  if (!parsedConfig.success) {
    throw new Error(
      `Invalid config: ${parsedConfig.error.issues.map(issue => `[${issue.path.join('.')}] - ${issue.message}`).join(', ')}`
    )
  }

  return parsedConfig.data
}