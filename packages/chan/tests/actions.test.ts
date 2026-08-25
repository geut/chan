import { describe, expect, it } from 'vitest'

import { actionCommands } from '../src/commands/actions.js'

describe('actions', () => {
  it('exports yarg command structure', () => {
    actionCommands.forEach(action => {
      expect(action.command).toBeDefined()
      expect(action.description).toBeDefined()

      expect(action.builder).toBeDefined()
      expect(action.builder).toHaveProperty('path')
      expect(action.builder).toHaveProperty('group')

      expect(action.handler).toBeDefined()
    })
  })
})
