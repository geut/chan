import toVFile from 'to-vfile'

export async function read (path) {
  try {
    const file = await toVFile.read(path)
    return file
  } catch (err) {
    if (err.code === 'ENOENT') {
      return toVFile(path)
    } else {
      throw err
    }
  }
}

export async function write ({ file, stdout }) {
  if (stdout) {
    process.stdout.write(file.toString())
  } else {
    await toVFile.write(file)
  }
}
