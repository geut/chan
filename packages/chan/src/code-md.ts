import { join } from 'node:path'
import { mkdir, readFile } from 'node:fs/promises'
import writeAtomic from 'fast-write-atomic'

import type { CommitAnalysisResponse } from '@geut/chan-ai'

import type { CommitMetadata } from './git.js'

export const CHAN_DIR = '.chan'
export const HOOKS_DIRNAME = 'hooks'
export const CODE_MD_FILENAME = 'code.md'
export const POST_COMMIT_FILENAME = 'post-commit'

export const CODE_MD_HEADING = `# Code Knowledge Base

<!-- Append-only knowledge base maintained by \`chan analyze\`. -->
<!-- Do not remove or rewrite existing entries; only append new ones. -->

`

export function chanDir(cwd: string): string {
  return join(cwd, CHAN_DIR)
}

export function codeMdPath(cwd: string): string {
  return join(chanDir(cwd), CODE_MD_FILENAME)
}

export function hooksDir(cwd: string): string {
  return join(chanDir(cwd), HOOKS_DIRNAME)
}

export async function ensureChanDir(cwd: string): Promise<string> {
  const dir = chanDir(cwd)
  await mkdir(dir, { recursive: true })
  return dir
}

export interface FormatEntryOptions {
  meta: CommitMetadata
  analysis?: CommitAnalysisResponse
}

export function formatEntry({ meta, analysis }: FormatEntryOptions): string {
  const lines: string[] = [`## Commit ${meta.shortSha}`, '']

  lines.push(`- **Author:** ${meta.author} <${meta.authorEmail}>`)
  lines.push(`- **Date:** ${meta.date}`)

  if (meta.files.length > 0) {
    lines.push(`- **Files:** ${meta.files.map(f => `\`${f}\``).join(', ')}`)
  }

  lines.push(`- **Original message:** ${singleLine(meta.message)}`)

  if (analysis) {
    const breakingSuffix = analysis.breakingChange
      ? ` (breaking, confidence ${analysis.breakingConfidence})`
      : ''
    lines.push(`- **Tags:** ${analysis.category}${breakingSuffix}`)

    if (analysis.packagesAffected.length > 0) {
      lines.push(`- **Packages:** ${analysis.packagesAffected.map(p => `\`${p}\``).join(', ')}`)
    }

    lines.push(`- **Analysis:** ${singleLine(analysis.analysis)}`)

    if (analysis.breakingDetails) {
      lines.push(`- **Breaking details:** ${singleLine(analysis.breakingDetails)}`)
    }
    if (analysis.relatedCode.length > 0) {
      lines.push(`- **Related code:** ${analysis.relatedCode.join(', ')}`)
    }
    if (analysis.relatedIssues.length > 0) {
      lines.push(`- **Related issues:** ${analysis.relatedIssues.join(', ')}`)
    }
    if (analysis.coauthors.length > 0) {
      lines.push(`- **Coauthors:** ${analysis.coauthors.join(', ')}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

function singleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export interface AppendEntriesOptions {
  cwd: string
  entries: string[]
}

export async function appendEntries({
  cwd,
  entries,
}: AppendEntriesOptions): Promise<void> {
  if (entries.length === 0) return

  const path = codeMdPath(cwd)
  await ensureChanDir(cwd)

  let existing = ''
  try {
    existing = await readFile(path, 'utf8')
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code !== 'ENOENT') {
      throw err
    }
    existing = ''
  }

  if (!existing.startsWith('# Code Knowledge Base')) {
    existing = CODE_MD_HEADING + existing
  }

  const prefix = existing.endsWith('\n') ? existing : `${existing}\n`
  const appended = entries.map(e => `${e}\n`).join('\n')
  const next = `${prefix}${appended}`

  await writeAtomic.promise(path, next)
}

export async function initCodeMd(cwd: string): Promise<void> {
  await ensureChanDir(cwd)
  const path = codeMdPath(cwd)
  try {
    await readFile(path, 'utf8')
    // already exists — do not overwrite (append-only).
    return
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code !== 'ENOENT') {
      throw err
    }
  }
  await writeAtomic.promise(path, CODE_MD_HEADING)
}
