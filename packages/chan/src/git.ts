import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const SHA_CHUNK = 100
const FULL_SHA = /^[0-9a-f]{40}$/

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
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: opts.maxBuffer ?? 10 * 1024 * 1024,
  })
}

function uniqueInOrder(shas: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const sha of shas) {
    if (seen.has(sha)) continue
    seen.add(sha)
    unique.push(sha)
  }
  return unique
}

function chunked(shas: string[], size: number): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < shas.length; i += size) {
    chunks.push(shas.slice(i, i + size))
  }
  return chunks
}

function shaMatches(full: string, input: string): boolean {
  return full.startsWith(input) || input.startsWith(full)
}

// A record header is a full SHA followed by its abbreviation (`%h`).
function isRecordStart(tokens: string[], index: number): boolean {
  const sha = tokens[index]
  const abbrev = tokens[index + 1]
  if (!sha || !abbrev || !FULL_SHA.test(sha)) return false
  if (abbrev.length === 0 || abbrev.length >= sha.length) return false
  return sha.startsWith(abbrev)
}

// `git log -z --name-only` separates fields with NUL. A leading newline on a
// token is the commit separator, not part of the field. Empty tokens are
// separators (including the extra NUL before a merge's file list).
function parseCommitMetadata(stdout: string): CommitMetadata[] {
  const tokens = stdout.split('\0').map(token => (token.startsWith('\n') ? token.slice(1) : token))
  const records: CommitMetadata[] = []

  let index = 0
  while (index < tokens.length) {
    if (tokens[index] === '') {
      index += 1
      continue
    }

    if (!isRecordStart(tokens, index)) {
      const current = records[records.length - 1]
      const file = tokens[index]
      if (!current || file === undefined) {
        throw new Error('Unexpected git log metadata output')
      }
      current.files.push(file)
      index += 1
      continue
    }

    const sha = tokens[index] ?? ''
    const shortSha = tokens[index + 1] ?? ''
    const author = tokens[index + 2] ?? ''
    const authorEmail = tokens[index + 3] ?? ''
    const date = tokens[index + 4] ?? ''
    const message = (tokens[index + 5] ?? '').trim()
    records.push({ sha, shortSha, author, authorEmail, date, message, files: [] })
    index += 6
  }

  return records
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

export async function getCommitsMetadata(shas: string[], cwd: string): Promise<CommitMetadata[]> {
  if (shas.length === 0) return []

  const unique = uniqueInOrder(shas)
  const records: CommitMetadata[] = []

  for (const chunk of chunked(unique, SHA_CHUNK)) {
    const { stdout } = await git(
      [
        'log',
        '--no-walk=unsorted',
        '-z',
        '--name-only',
        '--diff-merges=dense-combined',
        '--pretty=format:%H%x00%h%x00%an%x00%ae%x00%aI%x00%B%x00',
        '--end-of-options',
        ...chunk,
        '--',
      ],
      { cwd }
    )
    const parsed = parseCommitMetadata(stdout)
    if (parsed.length !== chunk.length) {
      const missing = chunk.find(sha => !parsed.some(record => shaMatches(record.sha, sha)))
      throw new Error(`No metadata for commit ${missing ?? chunk[0]}`)
    }
    records.push(...parsed)
  }

  return shas.map(input => {
    const record = records.find(item => shaMatches(item.sha, input))
    if (!record) throw new Error(`No metadata for commit ${input}`)
    return record
  })
}

export async function getCommitMetadata(sha: string, cwd: string): Promise<CommitMetadata> {
  const [meta] = await getCommitsMetadata([sha], cwd)
  if (!meta) throw new Error(`No metadata for commit ${sha}`)
  return meta
}
