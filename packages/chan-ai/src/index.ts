import { promisify } from 'node:util'
import { exec as execRaw } from 'node:child_process'
import { createProvider, isKnownProvider } from './providers/index.js'

import {
  type SHA,
  type AIConfig,
  type AnalyzeArgs,
  type AnalyzeFn,
  type AugmentArgs,
  type AugmentFn,
  type CommitAnalysisResponse,
  type ActionAugmentationResponse,
  AIConfigSchema,
  CommitAnalysisResponseSchema,
  ActionAugmentationResponseSchema,
} from './types.js'
import type { CompletionResult } from './providers/types.js'

export {
  AIConfigSchema,
  CommitAnalysisResponseSchema,
  ActionAugmentationResponseSchema,
  CATEGORIES,
  CHAN_ACTIONS,
} from './types.js'
export type {
  AIConfig,
  CommitAnalysisResponse,
  ActionAugmentationResponse,
  AnalyzeFn,
  AugmentFn,
  AnalyzeArgs,
  AugmentArgs,
  SHA,
} from './types.js'
export type {
  Provider,
  ProviderConfig,
  ChatMessage,
  CompletionResult,
  TokenUsage,
} from './providers/types.js'
export { MockProvider } from './providers/index.js'

const exec = promisify(execRaw)

export async function getCommitInfo({
  commitSha,
  cwd,
}: {
  commitSha: SHA
  cwd: string
}): Promise<string> {
  const { stdout, stderr } = await exec(
    `git show ${commitSha} --pretty=format:"%h%n%s%nBody:%b%n%an (%ae)%n%aI%n%p" -U0`,
    {
      cwd,
    }
  )

  if (stderr) {
    throw new Error(stderr)
  }

  return stdout.trim()
}

function getTokenUsage(responses: CompletionResult<CommitAnalysisResponse>[]) {
  const totalTokenUsage = responses.reduce(
    (acc, response) => {
      const usage = response?.usage
      return {
        input: acc.input + (usage?.input ?? 0),
        output: acc.output + (usage?.output ?? 0),
        total: acc.total + (usage?.total ?? 0),
      }
    },
    { input: 0, output: 0, total: 0 }
  )
  return totalTokenUsage
}

const SYSTEM_PROMPT = `
  You are a helpful assistant that analyzes commits and updates the code.md file.
  You will be given a commit with some information and you will need to analyze it to enhance the knowledge around that commit.
  Each commit information is formatted as follows: "%h%n%s%nBody:%b%n%an (%ae)%n%aI%n%p" (commit hash, commit message, message body (Body:%b), author name and email, ISO date, parent SHAs). The separator is "%n".
  The commit date is in the format strict ISO 8601.
  The output comes from the git show command. 
  The patch/diff is included in the commit information to analyze.
  
  ## About the analysis
  Analysis should be based on the commit message, body, and other commit metadata (including diffs).
  With your knowledge of the codebase, you will need to enhance the commit message with more details about the changes. 
  Be brief and to the point. Consider how this information could be used in the future along with other commits to understand how the codebase has evolved.

  ## About coauthors
  List the coauthors of the commit. Return an empty array if no coauthors are present.

  ## About categories
  You will need to categorize the changes into the following categories: Feature, Fix, Documentation, Refactor, Test, Chore, Style, Performance or Security.
  
  ## Breaking change decision (be consistent)
  You will also need to evaluate if it is a breaking change or not (true or false). Along with the decision you will need to provide a confidence level between 0 and 1, where 0 is the lowest confidence and 1 is the highest confidence. Any confidence level >= 0.8 is considered a strong decision. Lastly add breaking details if any (useful with low confidence levels).
  Definition: A breaking change is any change that can cause a previously working external consumer (downstream code, scripts, CI, integrations) to fail to build, fail at runtime, or behave incompatibly WITHOUT them changing their code, assuming they use public/documented surfaces.
  
  breakingChange: boolean — true only if a public/documented consumer could break without changing their code.
  breakingConfidence: number from 0 to 1 — confidence that breakingChange is correct (not P(breaking)).
  - 0.8–1.0: clear evidence in diff/message
  - 0.4–0.7: partial evidence
  - 0.0–0.3: weak evidence; prefer breakingChange false unless hard signals on public surface
  breakingDetails: string — required. If breakingChange is false, use "".

  Decision procedure:
  1. Look for HARD breaking signals in the diff/patch:
    - removed/renamed exports, CLI commands, flags, config keys
    - signature/return shape changes
    - output format changes (JSON/markdown/file layout)
    - entrypoint/export changes (package.json "exports"/"bin")
    - engine/runtime requirement changes
  If any are present and affect public surface => breakingChange = true.
  2. If only SOFT signals exist (refactor/tests/docs/internal changes) => breakingChange = false.
  3. Insufficient evidence: breakingChange false, breakingConfidence ≤ 0.3, state what evidence is missing.
  Use the provided codebase context to judge what is public API.

  ## About packages affected
  You will also need to evaluate if the changes are related to a specific package or not. If they are, you will need to provide the package name. Return an empty array if no packages are affected.

  ## About related code
  List files, functions or other code elements that are related to your analysis.

  ## About related issues
  List issues that are related to your analysis. This can be a github issue (#123) or jira (JIRA-456) or linear link. Return an empty array if no issues are related.

  Every decision should be backed by evidence. This is important.
  The condensed findings are going to be appended to the code.md file. 
  You don't need to update the code.md file, only generate the content.
  Response must be a valid JSON object. 
`
// TODO: provide codebase context -- this should be generated once and stored perhaps at the beginning of the code.md file
// const contextSchema = z.object({
//   codebase: z.string(),
// })

const DEFAULT_MAX_TOKENS = 1000

export function createAnalyzer(config: AIConfig): AnalyzeFn {
  const parsedConfig = AIConfigSchema.parse(config)
  const {
    provider,
    model,
    tools = [getCommitInfo],
    context,
    baseUrl,
    maxTokens = DEFAULT_MAX_TOKENS,
  } = parsedConfig

  if (typeof provider === 'string' && !isKnownProvider(provider)) {
    throw new Error(`Provider ${provider} is not supported`)
  }

  const modelProvider =
    typeof provider === 'string'
      ? createProvider(provider, { model, baseUrl, maxTokens })
      : provider

  return async ({
    commitShas,
    cwd,
  }: AnalyzeArgs): Promise<CompletionResult<CommitAnalysisResponse>[]> => {
    // call tools
    const toolResults = []
    for (const tool of tools) {
      // each tool should be called with the commit shas and the cwd
      const results = await Promise.all(commitShas.map(sha => tool({ commitSha: sha, cwd })))
      toolResults.push(...results)
    }

    const responses = await Promise.all(
      toolResults.map(result => {
        const messages = [
          { role: 'system' as const, content: SYSTEM_PROMPT },
          ...(context
            ? [{ role: 'system' as const, content: `Codebase context: ${context}` }]
            : []),
          {
            role: 'user' as const,
            content: `Analyze the following commit information:\n\n${result}`,
          },
        ]
        return modelProvider.invoke(messages, CommitAnalysisResponseSchema)
      })
    )

    // get token usage
    const tokenUsage = getTokenUsage(responses)
    console.log(
      `Total token usage: ${tokenUsage.total} (input: ${tokenUsage.input}, output: ${tokenUsage.output})`
    )

    return responses
  }
}

const AUGMENT_SYSTEM_PROMPT = `
  You are a helpful assistant that turns one or more git commits into a single keepachangelog-style changelog entry.
  You will receive: (a) optionally a user-provided message, (b) the commit SHAs covered, and (c) relevant context from the project's .chan/code.md knowledge base (per-commit analyses).

  ## Goal
  Produce ONE concise, user-facing changelog entry that summarizes the work across the given commits.
  - If the user provided a message, treat it as the intended changelog line and refine it for clarity; do not invent unrelated changes.
  - If no user message was provided, infer the changelog line from the commits and code.md context.

  ## action
  Choose exactly one keepachangelog verb: "added", "changed", "deprecated", "removed", "fixed", or "security".
  - added: new features / new capabilities.
  - changed: changes in existing functionality (includes refactors and performance changes that affect behavior).
  - deprecated: soon-to-be removed features.
  - removed: now-removed features.
  - fixed: bug fixes.
  - security: vulnerability fixes / security-relevant changes.

  ## classification
  Preserve the PRECISE chan-ai taxonomy in "classification" (one or more of): Feature, Fix, Documentation, Refactor, Test, Chore, Style, Performance, Security. This is more granular than "action" and may include multiple values. Keep it even when it overlaps with the chosen action.

  ## message
  A single concise sentence as it should appear in CHANGELOG.md. Imperative or past tense, no leading verb-prefix, no trailing period. Do not include the SHA.

  ## linkedShas
  The commit SHAs this entry corresponds to. Use the SHAs you were given. Short or full forms are both acceptable; prefer the form you were given.

  ## breakingChange
  true only if a public/documented consumer could break without changing their code (removed/renamed exports, signature/return-shape changes, output-format changes, entrypoint/export changes, engine/runtime bumps). Otherwise false. Provide breakingDetails when true, "" when false.

  ## confidence
  Confidence (0 to 1) that the chosen action and message correctly represent the commits.

  Respond with a single valid JSON object matching the given schema. No markdown, no prose outside the JSON.
`

export function createAugmenter(config: AIConfig): AugmentFn {
  const parsedConfig = AIConfigSchema.parse(config)
  const { provider, model, context, baseUrl, maxTokens = DEFAULT_MAX_TOKENS } = parsedConfig

  if (typeof provider === 'string' && !isKnownProvider(provider)) {
    throw new Error(`Provider ${provider} is not supported`)
  }

  const modelProvider =
    typeof provider === 'string'
      ? createProvider(provider, { model, baseUrl, maxTokens })
      : provider

  return async ({
    message,
    commitShas,
    codeMdContext,
  }: AugmentArgs): Promise<CompletionResult<ActionAugmentationResponse>> => {
    const userParts = [
      message
        ? `User-provided message: ${message}`
        : 'No user-provided message; infer it from the commits.',
      `Commit SHAs covered: ${commitShas.join(', ')}`,
      codeMdContext
        ? `.chan/code.md context (per-commit analyses for these commits and recent neighbors):\n${codeMdContext}`
        : '.chan/code.md context: (not available)',
    ]

    const messages = [
      { role: 'system' as const, content: AUGMENT_SYSTEM_PROMPT },
      ...(context ? [{ role: 'system' as const, content: `Codebase context: ${context}` }] : []),
      { role: 'user' as const, content: userParts.join('\n\n') },
    ]

    const result = await modelProvider.invoke(messages, ActionAugmentationResponseSchema)
    console.log(
      `Augment token usage: ${result.usage.total} (input: ${result.usage.input}, output: ${result.usage.output})`
    )
    return result
  }
}