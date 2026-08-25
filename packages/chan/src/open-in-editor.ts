import tempfile from 'tempfile'
import editor from 'editor'
import { promises as fs } from 'node:fs'

async function openEditor(tmpFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    editor(tmpFile, (code: number) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Cannot create temp file.'))
      }
    })
  })
}

export async function openInEditor(): Promise<string | null> {
  try {
    const tmpFile = tempfile('.md')
    await openEditor(tmpFile)
    const data = await fs.readFile(tmpFile, 'utf8')
    return data
  } catch {
    return null
  }
}
