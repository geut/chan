import type { z } from 'zod'
import type { Provider, ChatMessage, CompletionResult } from './types.js'

export class MockProvider implements Provider {
  private response: unknown

  constructor(response: unknown) {
    this.response = response
  }

  async invoke<T>(_messages: ChatMessage[], schema: z.ZodSchema<T>): Promise<CompletionResult<T>> {
    return {
      parsed: schema.parse(this.response),
      raw: this.response,
      usage: { input: 0, output: 0, total: 0 },
    }
  }
}