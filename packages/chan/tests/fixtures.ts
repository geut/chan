import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

export interface TempRepo {
  dir: string
  commits: string[]
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim()
}

export function createTempGitRepo(): TempRepo {
  const dir = mkdtempSync(join(tmpdir(), 'chan-test-'))
  git(['init'], dir)
  git(['config', 'commit.gpgsign', 'false'], dir)
  git(['config', 'tag.gpgsign', 'false'], dir)
  git(['config', 'user.email', 'test@test.com'], dir)
  git(['config', 'user.name', 'Chan Test User'], dir)

  const commits: string[] = []

  writeFileSync(join(dir, 'index.ts'), 'export const add = (a: number, b: number) => a + b\n')
  git(['add', '.'], dir)
  git(['commit', '-m', 'feat: add function'], dir)
  commits.push(git(['rev-parse', 'HEAD'], dir))

  writeFileSync(
    join(dir, 'index.ts'),
    'export const add = (a: number, b: number) => a + b\nexport const mul = (a: number, b: number) => a * b\n'
  )
  git(['add', '.'], dir)
  git(['commit', '-m', 'feat: add multiply function'], dir)
  commits.push(git(['rev-parse', 'HEAD'], dir))

  writeFileSync(join(dir, 'index.ts'), 'export const add = (a: number, b: number) => a + b\n')
  git(['add', '.'], dir)
  git(['commit', '-m', 'fix: remove multiply function'], dir)
  commits.push(git(['rev-parse', 'HEAD'], dir))

  return { dir, commits }
}