import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { select } from 'unist-util-select'
import type { Node } from 'unist'
import type { VFile } from 'vfile'

import { remarkToChan } from '@geut/remark-chan'
import { stringify } from '@geut/chan-stringify'

import {
  initialize as transformerInitialize,
  addChanges as transformerAddChanges,
  addRelease as transformerAddRelease,
  type InitializeOptions,
  type AddChangesOptions,
  type AddReleaseOptions,
} from './transformer.js'

export type { InitializeOptions, AddChangesOptions, AddReleaseOptions }

export {
  initialize as transformerInitialize,
  addChanges as transformerAddChanges,
  addRelease as transformerAddRelease,
} from './transformer.js'

function createPipeline(transformer: (...args: any[]) => any, opts: any = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkToChan)
    .use(transformer, opts)
    .use(stringify)
}

export async function initialize(from: VFile, opts: InitializeOptions = {}): Promise<VFile> {
  return createPipeline(transformerInitialize, opts).process(from)
}

export async function addChanges(from: VFile, opts: AddChangesOptions): Promise<VFile> {
  return createPipeline(transformerAddChanges, opts).process(from)
}

export async function addRelease(from: VFile, opts: AddReleaseOptions): Promise<VFile> {
  return createPipeline(transformerAddRelease, opts).process(from)
}

export function getMarkdownRelease(from: VFile, { version }: { version: string }): string {
  const processor = unified().use(remarkParse).use(remarkToChan)

  const chanTree = processor.runSync(processor.parse(from))
  const release = select(`release[identifier=${version}]`, chanTree as unknown as Node & Record<string, unknown>)

  if (!release) {
    throw new Error(`Release ${version} not found`)
  }

  const stringifyProcessor = unified().use(stringify, { withPreface: false })
  return stringifyProcessor.stringify({ type: 'root', children: [release] } as Node) as string
}
