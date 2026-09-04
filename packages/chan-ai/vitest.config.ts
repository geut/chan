// vitest.config.ts (default, no e2e)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/e2e/**/*.test.ts', '**/node_modules/**'],
  },
})