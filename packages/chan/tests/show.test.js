
import * as show from '../src/commands/show.js'

test('export yarg command structure', () => {
  expect(show.command).toMatch(/show/)
  expect(show.description).toBeDefined()

  expect(show.builder).toBeDefined()
  expect(show.builder).toHaveProperty('semver')
  expect(show.builder).toHaveProperty('path')

  expect(show.handler).toBeDefined()
})
