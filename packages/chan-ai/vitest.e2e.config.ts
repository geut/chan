import { defineConfig } from 'vitest/config'

import { geutAliases } from '../../vitest.aliases.ts'

export default defineConfig({
  resolve: {
    alias: geutAliases,
  },
  test: {
    include: ['**/e2e/**/*.test.ts'],
    testTimeout: 60000,
  },
})