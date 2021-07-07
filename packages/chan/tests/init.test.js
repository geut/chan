
import * as init from '../src/commands/init.js'

test('export yarg command structure', () => {
  expect(init.command).toMatch(/init/)
  expect(init.description).toBeDefined()

  expect(init.builder).toBeDefined()
  expect(init.builder).toHaveProperty('dir')
  expect(init.builder).toHaveProperty('overwrite')

  expect(init.handler).toBeDefined()
})
