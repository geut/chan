import { OpenAICompatibleProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { GoogleProvider } from './google.js'
import { MockProvider } from './mock.js'
import type { Provider, ProviderConfig } from './types.js'

export { OpenAICompatibleProvider, AnthropicProvider, GoogleProvider, MockProvider }
export type {
  Provider,
  ProviderConfig,
  ChatMessage,
  CompletionResult,
  TokenUsage,
} from './types.js'

export const DEFAULT_PROVIDERS: Record<string, (config: ProviderConfig) => Provider> = {
  openai: c => new OpenAICompatibleProvider({ baseUrl: 'https://api.openai.com/v1', ...c }),
  opencode: c => new OpenAICompatibleProvider({ baseUrl: 'https://opencode.ai/zen/v1/', ...c }),
  openrouter: c => new OpenAICompatibleProvider({ baseUrl: 'https://openrouter.ai/api/v1', ...c }),
  groq: c => new OpenAICompatibleProvider({ baseUrl: 'https://api.groq.com/openai/v1', ...c }),
  together: c => new OpenAICompatibleProvider({ baseUrl: 'https://api.together.xyz/v1', ...c }),
  anthropic: c => new AnthropicProvider({ baseUrl: 'https://api.anthropic.com/v1', ...c }),
  google: c =>
    new GoogleProvider({ baseUrl: 'https://generativelanguage.googleapis.com/v1beta', ...c }),
}

export function createProvider(name: string, config: ProviderConfig): Provider {
  const factory = DEFAULT_PROVIDERS[name]
  if (!factory) {
    // Default to OpenAI-compatible for unknown providers (catches Ollama, local servers, proxies, etc.)
    return new OpenAICompatibleProvider(config)
  }
  return factory(config)
}

export function isKnownProvider(name: string): boolean {
  return name in DEFAULT_PROVIDERS
}