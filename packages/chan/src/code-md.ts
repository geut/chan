import { join } from 'node:path'
import { mkdir, readFile } from 'node:fs/promises'
import writeAtomic from 'fast-write-atomic'

import type { CommitAnalysisResponse } from '@geut/chan-ai'

import type { CommitMetadata } from './git.js'
import type { ChanAction } from './categories.js'

export const CHAN_DIR = '.chan'
export const HOOKS_DIRNAME = 'hooks'
export const CODE_MD_FILENAME = 'code.md'
export const POST_COMMIT_FILENAME = 'post-commit'

export const CODE_MD_HEADING = `# Code Knowledge Base

<!-- Append-only knowledge base maintained by \`chan analyze\`. -->
<!-- Do not remove or rewrite existing entries; only append new ones. -->

`

export const CONTEXT_START_MARKER = '<!-- chan:context:start -->'
export const CONTEXT_END_MARKER = '<!-- chan:context:end -->'

// Structural shape of the AI Inspection response (chan-ai's
// ProjectInspectionResponse, slice 12). Defined locally so this module does
// not depend on the chan-ai schema landing first.
export interface CodeBaseContext {
  description: string
  usage: string
  runtimes: string[]
  projectTypes: string[]
  requirements: string[]
  notes: string[]
}

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

    if (analysis.breakingChange) {
      lines.push(`- **Breaking change:** yes`)
      lines.push(`- **Breaking confidence:** ${analysis.breakingConfidence}`)
      if (analysis.breakingDetails) {
        lines.push(`- **Breaking details:** ${singleLine(analysis.breakingDetails)}`)
      }
    } else if (analysis.breakingDetails) {
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

export function formatContextSection(context: CodeBaseContext): string {
  const lines: string[] = [CONTEXT_START_MARKER, '', '## Context', '']

  lines.push(`- **Description:** ${singleLine(context.description)}`)
  lines.push(`- **Usage:** ${singleLine(context.usage)}`)
  lines.push(`- **Runtimes:** ${context.runtimes.join(', ')}`)
  lines.push(`- **Project types:** ${context.projectTypes.join(', ')}`)
  lines.push(`- **Requirements:** ${context.requirements.join(', ')}`)
  lines.push(`- **Notes:** ${context.notes.map(singleLine).join(', ')}`)

  lines.push('', CONTEXT_END_MARKER, '')
  return lines.join('\n')
}

export function hasContextSection(content: string): boolean {
  return content.includes(CONTEXT_START_MARKER) && content.includes(CONTEXT_END_MARKER)
}

// A Context section is "empty" when none of its fields carry content
// (e.g. an all-empty Inspection response was stored so a re-run can refill
// it). Markers with no body, or body with only blank field values, count
// as empty.
export function isContextEmpty(content: string): boolean {
  const start = content.indexOf(CONTEXT_START_MARKER)
  const end = content.indexOf(CONTEXT_END_MARKER)
  if (start === -1 || end === -1 || end < start) return true
  const body = content.slice(start + CONTEXT_START_MARKER.length, end)
  return !/- \*\*[^*]+\*\* \S/.test(body)
}

export async function readContextSection(cwd: string): Promise<string> {
  const content = await readCodeMd(cwd)
  const start = content.indexOf(CONTEXT_START_MARKER)
  const end = content.indexOf(CONTEXT_END_MARKER)
  if (start === -1 || end === -1 || end < start) return ''
  return content.slice(start + CONTEXT_START_MARKER.length, end).trim()
}

export interface WriteContextSectionOptions {
  cwd: string
  context: CodeBaseContext
}

// ADR-0001: the Context section is the machine-owned, append-only-exempt part
// of the Knowledge Base. Insert after the heading when markers are absent or
// the section is empty; no-op when a populated Context already exists; never
// touch existing entries.
export async function writeContextSection({
  cwd,
  context,
}: WriteContextSectionOptions): Promise<void> {
  await ensureChanDir(cwd)
  const path = codeMdPath(cwd)

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

  if (hasContextSection(existing) && !isContextEmpty(existing)) {
    // populated Context — never rewrite (append-only exemption only covers
    // missing/empty sections).
    return
  }

  const section = formatContextSection(context)

  let next: string
  if (hasContextSection(existing)) {
    // empty section present — replace the marker block with the fresh one.
    const start = existing.indexOf(CONTEXT_START_MARKER)
    const end = existing.indexOf(CONTEXT_END_MARKER)
    const before = existing.slice(0, start)
    const afterContent = existing.slice(end + CONTEXT_END_MARKER.length).replace(/^\n+/, '')
    // section already ends with a single newline; keep exactly one blank
    // line before the following content (or a clean EOF).
    next = afterContent ? `${before}${section}\n${afterContent}` : `${before}${section}`
  } else {
    // no markers — insert right after the heading, before the first
    // `## ` entry (Commit / Action). Falls back to appending at the end.
    const firstEntry = existing.search(/^## /m)
    if (firstEntry === -1) {
      const prefix = existing.endsWith('\n') || existing === '' ? existing : `${existing}\n`
      next = `${prefix}${section}`
    } else {
      const before = existing.slice(0, firstEntry)
      next = `${before}${section}\n${existing.slice(firstEntry)}`
    }
  }

  await writeAtomic.promise(path, next.endsWith('\n') ? next : `${next}\n`)
}

export interface FormatActionEntryOptions {
  action: ChanAction
  date: string
  message: string
  classification: string[]
  commits: string[]
  group?: string
  breakingChange?: boolean
  breakingDetails?: string
}

export function formatActionEntry({
  action,
  date,
  message,
  classification,
  commits,
  group,
  breakingChange,
  breakingDetails,
}: FormatActionEntryOptions): string {
  const lines: string[] = [`## Action ${action}`, '']

  lines.push(`- **Date:** ${date}`)
  lines.push(`- **Message:** ${singleLine(message)}`)
  lines.push(`- **Classification:** ${classification.join(', ')}`)

  if (commits.length > 0) {
    lines.push(`- **Commits:** ${commits.map(c => `\`${c}\``).join(', ')}`)
  }

  if (group) {
    lines.push(`- **Group:** ${group}`)
  }

  if (breakingChange) {
    lines.push(`- **Breaking change:** yes`)
    if (breakingDetails) {
      lines.push(`- **Breaking details:** ${singleLine(breakingDetails)}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

export interface AppendActionEntryOptions {
  cwd: string
  entry: string
}

export async function appendActionEntry({
  cwd,
  entry,
}: AppendActionEntryOptions): Promise<void> {
  await appendEntries({ cwd, entries: [entry] })
}

// Correlation: return the SHAs of `## Commit <sha>` entries appended after the
// last `## Action <type>` block (or all of them if there is no action yet).
// This is the default context for `chan <action> 'msg'` + AI.
export async function commitsSinceLastAction(cwd: string): Promise<string[]> {
 const content = await readCodeMd(cwd)
 if (!content) return []

 const lines = content.split('\n')
 const shas: string[] = []
 for (const line of lines) {
   if (/^##\s+Action\s+/.test(line)) {
     shas.length = 0
     continue
   }
   const match = /^##\s+Commit\s+([0-9a-f]{7,40})/.exec(line)
   if (match) {
     const [, sha] = match
     if (sha) shas.push(sha)
   }
 }
 return shas
}

export async function readCodeMd(cwd: string): Promise<string> {
 try {
   return await readFile(codeMdPath(cwd), 'utf8')
 } catch (err) {
   if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
     return ''
   }
   throw err
 }
}

// Build a compact context string from .chan/code.md for the augmenter prompt.
// Includes the commit entries for the given SHAs (matched by short sha prefix).
export async function codeMdContextForShas(
  cwd: string,
  shas: string[]
): Promise<string> {
 if (shas.length === 0) return ''
 const content = await readCodeMd(cwd)
 if (!content) return ''

 const blocks = content.split(/\n(?=##\s+(?:Commit|Action)\s)/)
 const wanted = blocks.filter(block => {
   const match = /^##\s+Commit\s+([0-9a-f]{7,40})/.exec(block)
   if (!match) return false
   const [, sha = ''] = match
   return shas.some(s => sha.startsWith(s) || s.startsWith(sha))
 })
 return wanted.join('\n\n').trim()
}

export interface BreakingFinding {
  sha: string
  breakingDetails: string
  confidence: number
}

// Scan .chan/code.md for commit entries flagged as breaking changes.
// `sinceLastAction` scopes the scan to commits appended after the last
// `## Action` block (i.e. work not yet released). If no action exists, all
// commit entries are considered.
export async function scanBreakingChanges(
  cwd: string
): Promise<BreakingFinding[]> {
 const content = await readCodeMd(cwd)
 if (!content) return []

 const blocks = content.split(/\n(?=##\s+(?:Commit|Action)\s)/)
 const findings: BreakingFinding[] = []
 let stopAtAction = false

 // Iterate newest-first (blocks are in append order; reverse for newest-first).
 for (const block of blocks.toReversed()) {
   if (/^##\s+Action\s+/.test(block)) {
     // reached an action marker — stop, everything before is already released.
     stopAtAction = true
     break
   }
   const shaMatch = /^##\s+Commit\s+([0-9a-f]{7,40})/.exec(block)
   if (!shaMatch) continue
   const [, sha] = shaMatch

   const breakingMatch = /-\s+\*\*Breaking change:\*\*\s+yes/.exec(block)
   if (!breakingMatch) continue

   const detailsMatch = /-\s+\*\*Breaking details:\*\*\s+(.*)/.exec(block)
   const confidenceMatch = /-\s+\*\*Breaking confidence:\*\*\s+([0-9.]+)/.exec(block)
   findings.push({
     sha: sha ?? '',
     breakingDetails: detailsMatch?.[1]?.trim() ?? '',
     confidence: confidenceMatch ? Number(confidenceMatch[1]) : 1,
   })
 }

 if (stopAtAction) return findings
 // No action marker at all → all breaking commits count.
 return findings
}
