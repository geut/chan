import { z } from 'zod'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AIMessage } from '@langchain/core/messages'

const AIConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  context: z.string().optional(),
  chatModel: z.custom<BaseChatModel>().optional(),
  includeRaw: z.boolean().optional(),
  maxTokens: z.number().optional(),
  endpoint: z.string().optional(),
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
  author: z.string(),
  authorEmail: z.string().describe('Author email.'),
  coauthors: z.array(z.string()).describe('Coauthors of the commit.'),
  date: z.string(),
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
type AnalyzeFn = (args: AnalyzeArgs) => Promise<AnalyzeResponse[]>
type AIConfig = z.infer<typeof AIConfigSchema>
type CommitAnalysisResponse = z.infer<typeof CommitAnalysisResponseSchema>
interface AnalyzeResponse {
  parsed: CommitAnalysisResponse
  raw: AIMessage | undefined
}

export { AIConfigSchema, CommitAnalysisResponseSchema, CATEGORIES }
export type { AIConfig, CommitAnalysisResponse, AnalyzeFn, AnalyzeArgs, AnalyzeResponse }