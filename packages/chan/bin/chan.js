#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Dev mode: sibling packages resolve to .ts source, use tsx to handle ESM TypeScript
const tsxPath = join(__dirname, '../../../node_modules/.bin/tsx')
const tsx = spawnSync(tsxPath, [join(__dirname, '../src/bin.ts'), ...process.argv.slice(2)], {
  stdio: 'inherit'
})

if (tsx.error) {
  // Production: tsx not available, use built dist
  import('../dist/src/bin.js')
}
