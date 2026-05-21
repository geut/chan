import { promisify } from 'node:util'
import { exec as execRaw } from 'node:child_process'
import type { AIConfig } from './types.js'
import { tool } from '@langchain/core/tools'
import { initChatModel } from 'langchain/chat_models/universal'
import { createMiddleware } from 'langchain'
import { z } from 'zod'
import { ToolMessage } from '@langchain/core/messages'

const exec = promisify(execRaw)

async function getCommit(commitSha: string, cwd: string) {
  const { stdout, stderr } = await exec(
    `git show ${commitSha} --pretty=format:"%h !! %s !! %an !! %ad" --date=short`,
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
  Each commit is formatted as follows: "%h !! %s !! %an !! %ad" (commit hash, commit message, author name, commit date). The separator is "!!".
  The commit date is in the format "YYYY-MM-DD".
  The output comes from the git show command.  

  Analysis should be based on the commit message, diff, and other commit metadata.
  With your knowledge of the codebase and the changes, you will need to enhance the commit message with more details about the changes. 
  You will need to categorize the changes into the following categories: feature, fix, docs, refactor, test, chore, style, performance, security.
  You will also need to evaluate if it is a breaking change or not.

  Every part of the analysis should be separated by a line break.
  Every decision should be backed by evidence. This is important.

  The condensed findings are going to be appended to the code.md file. You don't need to update the code.md file, only generate the content.
  The code.md file is a markdown file that contains the commits and the analysis of the commits.
`

export const CATEGORIES = [
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

export const commitAnalysisResponseSchema = z.object({
  sha: z.string(),
  analysis: z.string(),
  author: z.string(),
  date: z.string(),
  category: z.enum(CATEGORIES),
  breakingChange: z.enum(['yes', 'no']),
  relatedCode: z.array(z.string()).describe('Evidence backing the analysis.'),
  relatedIssues: z
    .array(z.string())
    .default([])
    .describe('Related issues (if any). This can be a github issue or jira or linear link.'),
})

const CONTEXT = `
  ## Project Overview

  **Chan** is a CLI tool and library ecosystem for writing and maintaining CHANGELOG.md files following the [Keep a Changelog](https://keepachangelog.com/) format. It provides a command-line interface for adding changes, creating releases, and managing changelog files in a structured way.
  
  ## Architecture

  ### Monorepo Structure

  The project uses a monorepo structure managed by:
  - **npm Workspaces**: For package management (migrated from Yarn Workspaces)

  ### Technology Stack

  - **Language**: JavaScript (ES Modules)
  - **Runtime**: Node.js (>=12.22.1 || >=14.13.0)
  - **Core Dependencies**:
    - unified - Unified interface for processing text
    - remark-parse - Markdown parser
    - yargs - CLI argument parsing
    - semver - Semantic versioning
    - unist-util-select - Tree selection utilities
    - vfile - Virtual file format for text processing

  ## File Structure Summary

  /Users/deka/Projects/geut/chan/
  ├── package.json                    # Root package, npm workspaces config
  ├── package-lock.json               # npm lockfile
  ├── tsconfig.json                   # TypeScript project references
  ├── .oxlintrc.json                  # oxlint configuration
  ├── .oxfmtrc.json                   # oxfmt configuration
  ├── .github/workflows/node-ci.yml   # GitHub Actions CI (outdated — still uses yarn)
  ├── .travis.yml                     # Travis CI (legacy)
  ├── README.md                       # Project documentation
  ├── CHANGELOG.md                    # Project changelog
  ├── CONTRIBUTING.md                 # Contribution guidelines
  ├── LICENSE                         # ISC license
  ├── assets/
  │   └── example.gif                 # Demo asset
  ├── docs/                           # Documentation (this file)
  ├── es5/                            # Legacy transpiled code
  │   ├── index.js
  │   ├── api/
  │   └── parser/
  ├── node_modules/                   # Dependencies
  └── packages/
      ├── chan/                       # CLI tool
      │   ├── bin/chan.js
      │   ├── src/
      │   │   ├── commands/
      │   │   ├── config.js
      │   │   ├── logger.js
      │   │   ├── vfs.js
      │   │   └── open-in-editor.js
      │   └── tests/
      ├── chan-core/                  # Core API
      │   ├── src/
      │   │   ├── index.js
      │   │   └── transformer.js
      │   └── tests/
      ├── chast/                      # AST spec (TypeScript)
      │   ├── src/
      │   │   ├── index.ts
      │   │   └── actions.ts
      │   └── node_modules/
      ├── remark-chan/                # Parser
      │   ├── src/index.js
      │   └── tests/
      ├── chan-stringify/             # Compiler
      │   ├── src/index.js
      │   └── test/
      └── git-url-parse/              # Git integration (TypeScript)
          └── src/index.ts
`

const contextSchema = z.object({
  codebase: z.string(),
})

export async function analyze({ commitShas, provider, model, chatModel, cwd }: AIConfig) {
  // Note (dk):
  // use context (model.invoke(context)) to pass the repo general knowledge
  // this repo general knowledge should be created with the init command

  const modelInstance =
    chatModel ??
    (await initChatModel(model, {
      modelProvider: provider,
      temperature: 0.25,
      maxTokens: 200,
      middleware: [handleToolErrors],
      configuration: {
        baseURL: 'https://opencode.ai/zen/v1/', // custom hack for using opencode zen
      },
      systemPrompt: SYSTEM_PROMPT,
      contextSchema,
    }))

  const commitsInfo = await getCommitsInfo.invoke({
    commitShas: commitShas.join(', '),
    cwd,
  })

  const modelWithStructure = modelInstance.withStructuredOutput(commitAnalysisResponseSchema)

  const messages = commitsInfo.map(commit => `Analyze the following commit: ${commit}`)

  const responses = await modelWithStructure.batch(messages, {
    maxConcurrency: 5,
    context: CONTEXT,
  })

  return responses
}