import { cpSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

export interface TempRepo {
  dir: string
  commits: string[] // list of SHAs in order
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', windowsHide: true }).trim()
}

let template: TempRepo | undefined

function buildTemplate(): TempRepo {
  if (template) return template

  const dir = mkdtempSync(join(tmpdir(), 'chan-ai-e2e-template-'))
  git(['init'], dir)
  git(['config', 'core.autocrlf', 'false'], dir)
  git(['config', 'advice.defaultBranchName', 'false'], dir)
  git(['config', 'commit.gpgsign', 'false'], dir)
  git(['config', 'tag.gpgsign', 'false'], dir)
  git(['config', 'user.email', 'test@test.com'], dir)
  git(['config', 'user.name', 'Chan Test User'], dir)

  const commits: string[] = []

  // Commit 1: a feature
  const initial = 'export const add = (a: number, b: number) => a + b'
  writeFileSync(join(dir, 'index.ts'), initial)
  git(['add', '.'], dir)
  git(['commit', '-m', 'add function to add two numbers'], dir)
  commits.push(git(['rev-parse', 'HEAD'], dir))

  // Commit 2: another feature
  const multiplicationFunction = 'export const product = (a: number, b: number) => a * b'
  const update = `${initial}\n${multiplicationFunction}`
  writeFileSync(join(dir, 'index.ts'), update)
  git(['add', '.'], dir)
  git(['commit', '-m', 'add multiply function'], dir)
  commits.push(git(['rev-parse', 'HEAD'], dir))

  // Commit 3: a breaking change -- remove product function
  writeFileSync(join(dir, 'index.ts'), initial)
  git(['add', '.'], dir)
  git(['commit', '-m', 'remove multiply function'], dir)
  commits.push(git(['rev-parse', 'HEAD'], dir))

  // Uncommitted README so analyze e2e commit diffs stay unchanged while init
  // inspection has distinctive, evidence-rich facts to ground the Context.
  writeFileSync(
    join(dir, 'README.md'),
    `# tiny-math

A Node.js library that exports \`add\` for adding two numbers.

## Usage

\`\`\`js
import { add } from 'tiny-math'
add(1, 2)
\`\`\`

Requires Node.js >= 20.
`
  )

  template = { dir, commits }
  return template
}

export function createTempGitRepo(): TempRepo {
  const source = buildTemplate()
  const dir = mkdtempSync(join(tmpdir(), 'chan-ai-e2e-'))
  cpSync(source.dir, dir, { recursive: true })
  return { dir, commits: [...source.commits] }
}
