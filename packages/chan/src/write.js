import toVFile from 'to-vfile'

export async function write({ file, stdout }) {
  if (stdout) {
    process.stdout.write(file.toString())
  } else {
    await toVFile.write(file)
  }
}
