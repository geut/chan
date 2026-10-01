import { defineConfig } from 'vitest/config'

import { geutAliases } from '../../vitest.aliases.ts'

export default defineConfig({
  resolve: {
    alias: geutAliases,
  },
  test: {
    exclude: ['**/e2e/**/*.test.ts', '**/node_modules/**'],
  },
})