import { z } from 'zod'
import type { CompletionResult, Provider } from './providers/types.js'

const SHASchema = z.hash('sha1')

const ToolSchema = z.function({
  input: [z.object({ commitSha: z.string(), cwd: z.string() })],
  output: z.promise(z.string()),
})

const AIConfigSchema = z.object({
  provider: z.union([z.string(), z.custom<Provider>()]),
  model: z.string(),
  // array of tool functions (receive an array of Shas and return a string)
  tools: z.array(ToolSchema).optional(),
  context: z.string().optional(),
  maxTokens: z.number().optional(),
  baseUrl: z.string().optional(),
})

const CATEGORIES = [
  'Feature',
  'Fix',
  'Documentation',
  'Refactor',
  'Test',
  'Chore',
  'Style',
  'Performance',
  'Security',
] as const

const CommitAnalysisResponseSchema = z.object({
  sha: z.string(),
  analysis: z.string(),
  author: z.string().describe('Author of the commit.'),
  authorEmail: z.string().describe('Author email.'),
  coauthors: z.array(z.string()).describe('Coauthors of the commit.'),
  date: z.string().describe('Date of the commit.'),
  category: z.enum(CATEGORIES),
  breakingChange: z.boolean().describe('Is the change a breaking change?'),
  breakingDetails: z.string().describe('Details about the breaking change (if any).'),
  breakingConfidence: z.number().describe('Confidence level of the breaking change.'),
  packagesAffected: z
    .array(z.string())
    .describe(
      'Packages affected by the changes. This is the name of the package as it is defined in the package.json file. Take into if the projects ia a monorepo, if not, just return the package name.'
    ),
  relatedCode: z.array(z.string()).describe('Evidence backing the analysis.'),
  relatedIssues: z
    .array(z.string())
    .describe(
      'Related issues (if any). This can be a github issue (#123) or jira (JIRA-456) or linear link.'
    ),
})

const AnalyzeArgsSchema = z.object({
  commitShas: z.array(z.string()),
  cwd: z.string(),
})

type AnalyzeArgs = z.input<typeof AnalyzeArgsSchema>
type AnalyzeFn = (args: AnalyzeArgs) => Promise<CompletionResult<CommitAnalysisResponse>[]>
type AIConfig = z.infer<typeof AIConfigSchema>
type CommitAnalysisResponse = z.infer<typeof CommitAnalysisResponseSchema>
type SHA = z.infer<typeof SHASchema>

export { AIConfigSchema, CommitAnalysisResponseSchema, CATEGORIES }
export type { AIConfig, CommitAnalysisResponse, AnalyzeFn, AnalyzeArgs, SHA }