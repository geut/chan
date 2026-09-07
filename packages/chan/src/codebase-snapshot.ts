import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Exact-name candidates in fixed priority order. Resolved against the
// already-read top-level listing (never by probing the filesystem) so the
// result is identical on case-sensitive and case-insensitive filesystems.
const README_CANDIDATES = ['README.md', 'readme.md', 'Readme.md', 'README'] as const

// The deterministic, filesystem-only gathering step that feeds an AI
// Inspection (chan-ai prompts over this string and never touches the
// filesystem itself). Sections appear in a fixed order; each degrades
// gracefully when its source is absent.
export async function buildCodebaseSnapshot(cwd: string): Promise<string> {
  const entries = await readdir(cwd, { withFileTypes: true })

  const sections: string[] = []

  const pkg = await readOptional(join(cwd, 'package.json'))
  if (pkg !== undefined) {
    sections.push(`## package.json\n\n${pkg.trimEnd()}`)
  }

  const readmeName = README_CANDIDATES.find(candidate =>
    entries.some(entry => entry.name === candidate)
  )
  if (readmeName !== undefined) {
    const readme = await readFile(join(cwd, readmeName), 'utf8')
    sections.push(`## README\n\n${readme.trimEnd()}`)
  }

  const listing = entries
    .map(entry => (entry.isDirectory() ? `${entry.name}/` : entry.name))
    .toSorted()
    .join('\n')
  sections.push(`## Top-level entries\n\n${listing}`)

  return `${sections.join('\n\n')}\n`
}

// Read a file's contents, returning undefined when it does not exist.
// Mirrors the ENOENT-only catch used across the chan filesystem code.
async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
      return undefined
    }
    throw err
  }
}
