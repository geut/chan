
import * as release from '../src/commands/release.js'

test('export yarg command structure', () => {
  expect(release.command).toMatch(/release/)
  expect(release.description).toBeDefined()

  expect(release.builder).toBeDefined()
  expect(release.builder).toHaveProperty('semver')
  expect(release.builder).toHaveProperty('path')
  expect(release.builder).toHaveProperty('yanked')
  expect(release.builder).toHaveProperty('git-template')
  expect(release.builder).toHaveProperty('git-url')
  expect(release.builder).toHaveProperty('git-branch')
  expect(release.builder).toHaveProperty('allow-yanked')
  expect(release.builder).toHaveProperty('allow-prerelease')
  expect(release.builder).toHaveProperty('merge-prerelease')
  expect(release.builder).toHaveProperty('ghrelease')
  expect(release.builder).toHaveProperty('git')
  expect(release.builder).toHaveProperty('release-prefix')

  expect(release.handler).toBeDefined()
})
