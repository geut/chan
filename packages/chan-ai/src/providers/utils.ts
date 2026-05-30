import type { z } from 'zod'
import type { ChatMessage } from './types.js'

function describeZodType(schema: z.ZodTypeAny, indent = ''): string {
  const ctor = (schema as { constructor: { name: string } }).constructor.name

  if (ctor === 'ZodString') {
    return 'string'
  }
  if (ctor === 'ZodNumber') {
    return 'number'
  }
  if (ctor === 'ZodBoolean') {
    return 'boolean'
  }
  if (ctor === 'ZodArray') {
    const el = (schema as unknown as { element: z.ZodTypeAny }).element
    return `Array<${describeZodType(el)}>`
  }
  if (ctor === 'ZodEnum') {
    const opts = (schema as unknown as { options: string[] }).options
    return `enum(${opts.map(o => `"${o}"`).join(', ')})`
  }
  if (ctor === 'ZodOptional') {
    const inner = (schema as unknown as { unwrap: () => z.ZodTypeAny }).unwrap()
    return `${describeZodType(inner)} (optional)`
  }
  if (ctor === 'ZodDefault') {
    const inner = (schema as unknown as { removeDefault: () => z.ZodTypeAny }).removeDefault()
    return describeZodType(inner)
  }
  if (ctor === 'ZodObject') {
    const shape = (schema as unknown as { shape: Record<string, z.ZodTypeAny> }).shape
    const fields = Object.entries(shape).map(([key, val]) => {
      const desc = val.description ? ` — ${val.description}` : ''
      return `${indent}  ${key}: ${describeZodType(val, indent + '  ')}${desc}`
    })
    return `{\n${fields.join(',\n')}${indent}\n${indent}}`
  }
  if (ctor === 'ZodUnion') {
    const opts = (schema as unknown as { options: z.ZodTypeAny[] }).options
    return opts.map(o => describeZodType(o, indent)).join(' | ')
  }
  if (ctor === 'ZodLiteral') {
    const val = (schema as unknown as { value: unknown }).value
    return `literal(${JSON.stringify(val)})`
  }

  return ctor.replace(/^Zod/, '').toLowerCase()
}

export function schemaToDescription(schema: z.ZodSchema<unknown>): string {
  const ctor = (schema as unknown as { constructor: { name: string } }).constructor.name
  if (ctor === 'ZodObject') {
    const shape = (schema as unknown as { shape: Record<string, z.ZodTypeAny> }).shape
    const fields = Object.entries(shape).map(([key, val]) => {
      const desc = val.description ? ` — ${val.description}` : ''
      return `  ${key}: ${describeZodType(val)}${desc}`
    })
    return `{\n${fields.join(',\n')}\n}`
  }
  return describeZodType(schema)
}

export function extractAndParseJson<T>(text: string, schema: z.ZodSchema<T>): T {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = codeBlockMatch ? codeBlockMatch[1] : text.trim()

  const start = jsonText?.indexOf('{') ?? -1
  const end = jsonText?.lastIndexOf('}') ?? -1
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in response')
  }

  const parsed = JSON.parse(jsonText?.slice(start, end + 1) ?? '')
  return schema.parse(parsed)
}

export function augmentSystemPrompt(messages: ChatMessage[], instruction: string): ChatMessage[] {
  const result = messages.map(m => ({ ...m }))
  const firstSystemIdx = result.findIndex(m => m.role === 'system')
  if (firstSystemIdx !== -1) {
    result[firstSystemIdx] = {
      ...result[firstSystemIdx],
      content: `${result[firstSystemIdx].content}\n\n${instruction}`,
    }
  } else {
    result.unshift({ role: 'system', content: instruction })
  }
  return result
}

export function withJsonInstruction(messages: ChatMessage[]): ChatMessage[] {
  const instruction =
    'You must respond with a single valid JSON object. Do not include markdown formatting, explanations, or any text outside the JSON object.'
  return augmentSystemPrompt(messages, instruction)
}

export function withSchemaInstruction<T>(
  messages: ChatMessage[],
  schema: z.ZodSchema<T>
): ChatMessage[] {
  const instruction =
    `You must respond with a single valid JSON object and nothing else. ` +
    `Do not include markdown code blocks, explanations, or any text outside the JSON object. ` +
    `The JSON object must match this exact schema:\n${schemaToDescription(schema)}`
  return augmentSystemPrompt(messages, instruction)
}