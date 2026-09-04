import type { z } from 'zod'
import type { Provider, ProviderConfig, ChatMessage, CompletionResult } from './types.js'
import { extractAndParseJson, withSchemaInstruction } from './utils.js'

interface OpenAIResponse {
  choices: {
    message: {
      content: string | null
      role: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '')
}

export class OpenAICompatibleProvider implements Provider {
  private model: string
  private apiKey?: string
  private baseUrl: string
  private maxTokens: number
  private headers: Record<string, string>

  constructor(config: ProviderConfig) {
    this.model = config.model
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY
    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? 'https://api.openai.com/v1')
    this.maxTokens = config.maxTokens ?? 1000
    this.headers = config.headers ?? {}
  }

  async invoke<T>(messages: ChatMessage[], schema: z.ZodSchema<T>): Promise<CompletionResult<T>> {
    const augmentedMessages = withSchemaInstruction(messages, schema)

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey ?? ''}`,
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify({
        model: this.model,
        messages: augmentedMessages,
        max_tokens: this.maxTokens,
        temperature: 0.15,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      const hint = error.includes('No provider available')
        ? ' (Hint: the model may be temporarily unroutable on this provider. Try a different model or provider.)'
        : ''
      throw new Error(
        `OpenAI API error (${response.status}) for model "${this.model}": ${error}${hint}`
      )
    }

    const data = (await response.json()) as OpenAIResponse
    const content = data.choices[0]?.message?.content ?? ''

    if (!content) {
      throw new Error('Empty response from OpenAI API')
    }

    const parsed = extractAndParseJson(content, schema)

    return {
      parsed,
      raw: data,
      usage: {
        input: data.usage?.prompt_tokens ?? 0,
        output: data.usage?.completion_tokens ?? 0,
        total: data.usage?.total_tokens ?? 0,
      },
    }
  }
}