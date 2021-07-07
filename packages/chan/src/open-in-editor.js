import tempfile from 'tempfile'
import editor from 'editor'
import { promises as fs } from 'fs'

async function openEditor (tmpFile) {
  return new Promise((resolve, reject) => {
    editor(tmpFile, code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Cannot create temp file.'))
      }
    })
  })
}

export async function openInEditor () {
  try {
    const tmpFile = tempfile('.md')
    await openEditor(tmpFile)
    const data = await fs.readFile(tmpFile, 'utf8')
    return data
  } catch (err) {
    return null
  }
}
