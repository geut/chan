import type { z } from 'zod'
import type { Provider, ProviderConfig, ChatMessage, CompletionResult } from './types.js'
import { extractAndParseJson, withSchemaInstruction } from './utils.js'

interface AnthropicResponse {
  content: { type: string; text?: string }[]
  usage: {
    input_tokens: number
    output_tokens: number
  }
  stop_reason: string | null
}

export class AnthropicProvider implements Provider {
  private model: string
  private apiKey?: string
  private baseUrl: string
  private maxTokens: number
  constructor(config: ProviderConfig) {
    this.model = config.model
    this.apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1'
    this.maxTokens = config.maxTokens ?? 800
  }

  async invoke<T>(messages: ChatMessage[], schema: z.ZodSchema<T>): Promise<CompletionResult<T>> {
    const augmentedMessages = withSchemaInstruction(messages, schema)
    const systemParts = augmentedMessages.filter(m => m.role === 'system')
    const nonSystemMessages = augmentedMessages.filter(m => m.role !== 'system')

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey ?? '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        system: systemParts.map(m => m.content).join('\n\n'),
        messages: nonSystemMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        max_tokens: this.maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error (${response.status}): ${error}`)
    }

    const data = (await response.json()) as AnthropicResponse
    const text = data.content.find(c => c.type === 'text')?.text ?? ''

    if (!text) {
      throw new Error('Empty response from Anthropic API')
    }

    const parsed = extractAndParseJson(text, schema)

    return {
      parsed,
      raw: data,
      usage: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
        total: data.usage.input_tokens + data.usage.output_tokens,
      },
    }
  }
}