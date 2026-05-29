import { promisify } from 'node:util'
import { exec as execRaw } from 'node:child_process'
import { tool } from '@langchain/core/tools'
import { initChatModel } from 'langchain/chat_models/universal'
import { createMiddleware } from 'langchain'
import { z } from 'zod'
import {
  type AIConfig,
  type AnalyzeArgs,
  type CommitAnalysisResponse,
  type AnalyzeFn,
  type AnalyzeResponse,
  AIConfigSchema,
  CommitAnalysisResponseSchema,
} from './types.js'

import { ToolMessage, type AIMessage } from '@langchain/core/messages'

const exec = promisify(execRaw)

async function getCommit(commitSha: string, cwd: string): Promise<string> {
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

const handleToolErrors = createMiddleware({
  name: 'handle_tool_errors',
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request)
    } catch (error) {
      return new ToolMessage({
        content: `Tool error: Please check your input and try again. (${error})`,
        tool_call_id: request.toolCall.id!,
      })
    }
  },
})

export const getCommitsInfo = tool(
  async ({ commitShas, cwd }: { commitShas: string; cwd: string }) => {
    const commitShasArray = commitShas.split(',')

    let commitsInfo = []
    for (const commitSha of commitShasArray) {
      const commit = await getCommit(commitSha, cwd)
      commitsInfo.push(commit as unknown as string)
    }
    return commitsInfo as unknown as string[]
  },
  {
    name: 'get_commits_info',
    description: 'Get information about one or more commits',
    schema: z.object({
      commitShas: z.string(),
      cwd: z.string().describe('The current working directory.'),
    }),
  }
)

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
`

const contextSchema = z.object({
  codebase: z.string(),
})

export async function createAnalyzer(config: AIConfig): Promise<AnalyzeFn> {
  AIConfigSchema.parse(config)
  const {
    provider,
    model,
    context,
    chatModel,
    endpoint,
    maxTokens = 800,
    includeRaw = false,
  } = config
  const modelInstance =
    chatModel ??
    (await initChatModel(model, {
      modelProvider: provider,
      maxTokens,
      middleware: [handleToolErrors],
      configuration: endpoint
        ? {
            baseURL: endpoint,
          }
        : undefined,
      systemPrompt: SYSTEM_PROMPT,
      contextSchema,
    }))

  return async ({ commitShas, cwd }: AnalyzeArgs): Promise<AnalyzeResponse[]> => {
    const commitsInfo = await getCommitsInfo.invoke({
      commitShas: commitShas.join(', '),
      cwd,
    })
    const modelWithStructure = modelInstance.withStructuredOutput(CommitAnalysisResponseSchema, {
      // @ts-expect-error - includeRaw is typed as boolean
      includeRaw,
    })

    const messages = commitsInfo.map(
      commit => `Analyze the following commit and return JSON:\n\n${commit}`
    )

    console.log({ context })
    const responses = await Promise.all(
      messages.map(
        message =>
          modelWithStructure.invoke(message, {
            // @ts-expect-error - context is typed as string
            context,
          }) as unknown as Promise<{
            parsed: CommitAnalysisResponse
            raw: AIMessage
          }>
      )
    )

    const parsedResponses = responses.map(response => {
      return {
        parsed: response.parsed || { ...response },
        raw: response.raw || {},
      }
    }) as unknown as AnalyzeResponse[]

    // store token usage
    // todo: move to a separate function (utils)
    const totalTokenUsage = responses.reduce((acc, response) => {
      console.log({ response })
      return acc + (response?.raw?.usage_metadata?.total_tokens ?? 0)
    }, 0)
    console.log(`Total token usage: ${totalTokenUsage}`)

    return parsedResponses
  }
}

// export async function analyze({
//   commitShas,
//   provider,
//   model,
//   chatModel,
//   cwd,
//   endpoint,
//   includeRaw = false,
//   maxTokens = 500,
// }: AIConfig) {
//   // Note (dk):
//   // use context (model.invoke(context)) to pass the repo general knowledge
//   // this repo general knowledge should be created with the init command
//   AIConfigSchema.parse({ commitShas, provider, model, chatModel, cwd, includeRaw })

//   const modelInstance =
//     chatModel ??
//     (await initChatModel(model, {
//       modelProvider: provider,
//       temperature: 0.25,
//       maxTokens,
//       middleware: [handleToolErrors],
//       configuration: endpoint
//         ? {
//             baseURL: endpoint,
//           }
//         : undefined,
//       systemPrompt: SYSTEM_PROMPT,
//       contextSchema,
//     }))

//   const commitsInfo = await getCommitsInfo.invoke({
//     commitShas: commitShas.join(', '),
//     cwd,
//   })

//   const modelWithStructure = modelInstance.withStructuredOutput(CommitAnalysisResponseSchema, {
//     // @ts-expect-error - includeRaw is typed as boolean
//     includeRaw,
//   })

//   const messages = commitsInfo.map(commit => `Analyze the following commit: ${commit}`)

//   const responses = await Promise.all(
//     messages.map(
//       message =>
//         modelWithStructure.invoke(message, {
//           // @ts-expect-error - context is typed as string
//           context: CONTEXT,
//         }) as unknown as Promise<{
//           parsed: CommitAnalysisResponse
//           raw: AIMessage
//         }>
//     )
//   )

//   const parsedResponses = responses.map(response => {
//     return {
//       parsed: response.parsed || { ...response },
//       raw: response.raw || {},
//     }
//   })

//   // store token usage
//   const totalTokenUsage = responses.reduce((acc, response) => {
//     console.log({ response })
//     return acc + (response?.raw?.usage_metadata?.total_tokens ?? 0)
//   }, 0)
//   console.log(`Total token usage: ${totalTokenUsage}`)

//   return parsedResponses
// }