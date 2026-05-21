import type { BaseChatModel } from 'langchain/chat_models/base'

// export interface CommitAnalysis {
//   sha: string
//   message: string
//   author: string
//   date: string
// }

export type EnrichFn = (config: AIConfig) => Promise<string>

export interface AIConfig {
  commitShas: string[]
  provider: string
  model: string
  cwd: string
  chatModel?: BaseChatModel | undefined
}