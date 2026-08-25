import { createAugmenter, createAnalyzer, type Provider, type AugmentFn, type AnalyzeFn } from '@geut/chan-ai'

import { loadConfig } from './config.js'

export interface AiResolvedConfig {
  provider: string | Provider
  model: string
  maxTokens?: number
  baseUrl?: string
}

export interface AiFlags {
  aiProvider?: string
  aiModel?: string
  aiMaxTokens?: number
  aiEndpoint?: string
}

// AI is considered enabled when a provider AND a model resolve (from CLI flags
// or .chanrc). The API key is resolved by the provider at invoke time (from
// env or .chanrc), so it is not required here to decide "enabled" — providers
// will surface a clear error if the key is missing when called.
export function resolveAiConfig(flags: AiFlags = {}): AiResolvedConfig | undefined {
  const config = loadConfig()
  const provider = flags.aiProvider ?? config.ai?.provider
  const model = flags.aiModel ?? config.ai?.model
  if (!provider || !model) return undefined
  return {
    provider,
    model,
    maxTokens: flags.aiMaxTokens ?? config.ai?.maxTokens,
    baseUrl: flags.aiEndpoint ?? config.ai?.endpoint,
  }
}

export function createAugmenterFromConfig(ai: AiResolvedConfig): AugmentFn {
  return createAugmenter({
    provider: ai.provider,
    model: ai.model,
    maxTokens: ai.maxTokens,
    baseUrl: ai.baseUrl,
  })
}

export function createAnalyzerFromConfig(ai: AiResolvedConfig): AnalyzeFn {
  return createAnalyzer({
    provider: ai.provider,
    model: ai.model,
    maxTokens: ai.maxTokens,
    baseUrl: ai.baseUrl,
  })
}
