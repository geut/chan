import { defineConfig } from 'vitest/config'

import { geutAliases } from '../../vitest.aliases.ts'

export default defineConfig({
  resolve: {
    alias: geutAliases,
  },
})
