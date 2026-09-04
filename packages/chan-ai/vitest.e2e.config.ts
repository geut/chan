// vitest.e2e.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/e2e/**/*.test.ts'],
    // Allow longer timeouts for LLM calls
    testTimeout: 60000,
  },
})