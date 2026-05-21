import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

export interface TempRepo {
  dir: string
  commits: string[] // list of SHAs in order
}

export function createTempGitRepo(): TempRepo {
  const dir = mkdtempSync(join(tmpdir(), 'chan-ai-e2e-'))
  console.log('dir', dir)
  execSync('git init', { cwd: dir })
  execSync('git config commit.gpgsign false', { cwd: dir })
  execSync('git config tag.gpgsign false', { cwd: dir })
  execSync('git config user.email "test@test.com"', { cwd: dir })
  execSync('git config user.name "Chan Test User"', { cwd: dir })

  const commits: string[] = []

  // Commit 1: a feature
  const initial = 'export const add = (a: number, b: number) => a + b'
  writeFileSync(join(dir, 'index.js'), initial)
  execSync("git add . && git commit -m 'feat: function to add two numbers'", {
    cwd: dir,
    encoding: 'utf-8',
    shell: 'bash',
  })
  commits.push(execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim().slice(0, 7))

  // Commit 2: a fix
  const multiplicationFunction = 'export const product = (a: number, b: number) => a * b'
  const update = `${initial}\n${multiplicationFunction}`
  writeFileSync(join(dir, 'index.js'), update)
  execSync("git add . && git commit -m 'fix: function to multiply two numbers'", {
    cwd: dir,
    encoding: 'utf-8',
    shell: 'bash',
  })
  commits.push(execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim().slice(0, 7))

  // Commit 3: a breaking change -- remove product function
  writeFileSync(join(dir, 'index.js'), initial)
  execSync('git add . && git commit -m "fix: remove product function"', {
    cwd: dir,
    encoding: 'utf-8',
    shell: 'bash',
  })
  commits.push(execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim().slice(0, 7))

  return { dir, commits }
}