import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AliasOptions } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

const source = (pkg: string, file = 'src/index.ts') =>
  resolve(root, 'packages', pkg, file)

// Exact matches so `@geut/chan` does not swallow `@geut/chan-core`.
export const geutAliases: AliasOptions = [
  { find: /^@geut\/chan-ai$/, replacement: source('chan-ai') },
  { find: /^@geut\/chan-core$/, replacement: source('chan-core') },
  { find: /^@geut\/chan-stringify$/, replacement: source('chan-stringify') },
  { find: /^@geut\/chast\/actions$/, replacement: source('chast', 'src/actions.ts') },
  { find: /^@geut\/chast$/, replacement: source('chast') },
  { find: /^@geut\/git-url-parse$/, replacement: source('git-url-parse') },
  { find: /^@geut\/remark-chan$/, replacement: source('remark-chan') },
  { find: /^@geut\/chan$/, replacement: source('chan') },
]
