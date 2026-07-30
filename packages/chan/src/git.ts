import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface CommitMetadata {
  sha: string
  shortSha: string
  author: string
  authorEmail: string
  date: string
  message: string
  files: string[]
}

interface GitOptions {
  cwd: string
  maxBuffer?: number
}

function git(args: string[], opts: GitOptions) {
  return execFileAsync('git', args, {
    cwd: opts.cwd,
    maxBuffer: opts.maxBuffer ?? 10 * 1024 * 1024,
  })
}

export async function getHeadSha(cwd: string): Promise<string> {
  const { stdout } = await git(['rev-parse', 'HEAD'], { cwd })
  return stdout.trim()
}

export interface LogOptions {
  limit?: number
}

export async function getCommitLog(cwd: string, opts: LogOptions = {}): Promise<string[]> {
  const limit = opts.limit ?? 50
  const { stdout } = await git(['log', '--pretty=format:%H', `--max-count=${limit}`], { cwd })
  const trimmed = stdout.trim()
  if (!trimmed) return []
  return trimmed.split('\n')
}

export async function getCommitMetadata(sha: string, cwd: string): Promise<CommitMetadata> {
  // NUL-separated fields; %B may contain newlines but never NUL.
  const format = '%H%x00%h%x00%an%x00%ae%x00%aI%x00%B%x00'
  const { stdout } = await git(['show', '--no-patch', `--pretty=format:${format}`, sha], { cwd })
  const parts = stdout.split('\x00')
  const fullSha = parts[0] ?? ''
  const shortSha = parts[1] ?? ''
  const author = parts[2] ?? ''
  const authorEmail = parts[3] ?? ''
  const date = parts[4] ?? ''
  const message = (parts[5] ?? '').trim()

  const { stdout: nameOnly } = await git(['show', '--name-only', '--pretty=format:', sha], { cwd })
  const files = nameOnly
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  return { sha: fullSha, shortSha, author, authorEmail, date, message, files }
}