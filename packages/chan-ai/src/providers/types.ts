import type { z } from 'zod'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  input: number
  output: number
  total: number
}

export interface CompletionResult<T> {
  parsed: T
  raw: unknown
  usage: TokenUsage
}

export interface Provider {
  invoke<T>(messages: ChatMessage[], schema: z.ZodSchema<T>): Promise<CompletionResult<T>>
}

export interface ProviderConfig {
  model: string
  apiKey?: string
  baseUrl?: string
  maxTokens?: number
  headers?: Record<string, string>
}