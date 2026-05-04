import { read as vfileRead, write as vfileWrite, toVFile } from 'to-vfile'
import type { VFile } from 'vfile'

export async function read(path: string): Promise<VFile> {
  try {
    const file = await vfileRead(path)
    return file
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return toVFile(path)
    }
    throw err
  }
}

interface WriteOptions {
  file: VFile
  stdout?: boolean
}

export async function write({ file, stdout }: WriteOptions): Promise<void> {
  if (stdout) {
    process.stdout.write(file.toString())
  } else {
    await vfileWrite(file)
  }
}
