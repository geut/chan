import type { z } from 'zod'
import type { Provider, ProviderConfig, ChatMessage, CompletionResult } from './types.js'
import { extractAndParseJson, withSchemaInstruction } from './utils.js'

interface GoogleResponse {
  candidates: {
    content: {
      parts: { text?: string }[]
      role: string
    }
    finishReason: string
  }[]
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export class GoogleProvider implements Provider {
  private model: string
  private apiKey?: string
  private baseUrl: string
  private maxTokens: number
  constructor(config: ProviderConfig) {
    this.model = config.model
    this.apiKey = config.apiKey ?? process.env.GOOGLE_API_KEY
    this.baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'
    this.maxTokens = config.maxTokens ?? 800
  }

  async invoke<T>(messages: ChatMessage[], schema: z.ZodSchema<T>): Promise<CompletionResult<T>> {
    const augmentedMessages = withSchemaInstruction(messages, schema)

    const systemText = augmentedMessages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n')
    const history = augmentedMessages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const url = new URL(`${this.baseUrl}/models/${this.model}:generateContent`)
    url.searchParams.set('key', this.apiKey ?? '')

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        contents: history,
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google API error (${response.status}): ${error}`)
    }

    const data = (await response.json()) as GoogleResponse
    const text = data.candidates[0]?.content?.parts[0]?.text ?? ''

    if (!text) {
      throw new Error('Empty response from Google API')
    }

    const parsed = extractAndParseJson(text, schema)

    return {
      parsed,
      raw: data,
      usage: {
        input: data.usageMetadata?.promptTokenCount ?? 0,
        output: data.usageMetadata?.candidatesTokenCount ?? 0,
        total: data.usageMetadata?.totalTokenCount ?? 0,
      },
    }
  }
}