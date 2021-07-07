
import { actionCommands } from '../src/commands/actions.js'

test('export yarg command structure', () => {
  actionCommands.forEach(action => {
    expect(action.command).toBeDefined()
    expect(action.description).toBeDefined()

    expect(action.builder).toBeDefined()
    expect(action.builder).toHaveProperty('path')
    expect(action.builder).toHaveProperty('group')

    expect(action.handler).toBeDefined()
  })
})
