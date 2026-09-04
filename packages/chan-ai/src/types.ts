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

// chan action verbs (keepachangelog). The augmenter infers one of these as the
// "action"; the precise AI category is preserved separately in `classification`.
const CHAN_ACTIONS = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
] as const

const ActionAugmentationResponseSchema = z.object({
  action: z.enum(CHAN_ACTIONS).describe(
    'The keepachangelog verb that best describes this change for the changelog.'
  ),
  message: z
    .string()
    .describe(
      'A concise, user-facing changelog entry derived from the commits and (if provided) the user message.'
    ),
  classification: z
    .array(z.enum(CATEGORIES))
    .describe(
      'Precise categories from the chan-ai taxonomy (Feature, Fix, Documentation, Refactor, Test, Chore, Style, Performance, Security). May include multiple.'
    ),
  linkedShas: z
    .array(z.string())
    .describe('Commit SHAs (short or full) that this changelog entry corresponds to.'),
  breakingChange: z
    .boolean()
    .describe('Whether this change is a breaking change for downstream consumers.'),
  breakingDetails: z.string().describe('Details about the breaking change (empty string if none).'),
  confidence: z.number().describe('Confidence level (0 to 1) of the inferred action/message.')
})

const AnalyzeArgsSchema = z.object({
  commitShas: z.array(z.string()),
  cwd: z.string(),
})

const AugmentArgsSchema = z.object({
  message: z.string().optional().describe('Optional user-provided change message. If absent, the AI infers it.'),
  commitShas: z.array(z.string()).describe('Commit SHAs the changelog entry covers.'),
  codeMdContext: z
    .string()
    .optional()
    .describe('Relevant slice of .chan/code.md (commit analyses) to inform the augmentation.'),
})

type AnalyzeArgs = z.input<typeof AnalyzeArgsSchema>
type AugmentArgs = z.input<typeof AugmentArgsSchema>
type AnalyzeFn = (args: AnalyzeArgs) => Promise<CompletionResult<CommitAnalysisResponse>[]>
type AugmentFn = (args: AugmentArgs) => Promise<CompletionResult<ActionAugmentationResponse>>
type AIConfig = z.infer<typeof AIConfigSchema>
type CommitAnalysisResponse = z.infer<typeof CommitAnalysisResponseSchema>
type ActionAugmentationResponse = z.infer<typeof ActionAugmentationResponseSchema>
type SHA = z.infer<typeof SHASchema>

export { AIConfigSchema, CommitAnalysisResponseSchema, ActionAugmentationResponseSchema, CATEGORIES, CHAN_ACTIONS }
export type {
  AIConfig,
  CommitAnalysisResponse,
  ActionAugmentationResponse,
  AnalyzeFn,
  AugmentFn,
  AnalyzeArgs,
  AugmentArgs,
  SHA,
}