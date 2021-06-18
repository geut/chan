import tempfile from 'tempfile'
import editor from 'editor'
import readFile from 'fs/promises'

async function openEditor (tmpFile) {
  return new Promise((resolve, reject) => {
    editor(tmpFile, code => {
      if (code === 0) {
        resolve()
      } else {
        reject()
      }
    })
  })
}

export async function openInEditor() {
  try {
    const tmpFile = tempfile('.md')
    await openEditor(tmpFile)
    const data = await readFile(tmpFile, 'utf8')
    return data
  } catch (err) {
    return null
  }
}
