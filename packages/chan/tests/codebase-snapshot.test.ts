import { mkdtempSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildCodebaseSnapshot } from '../src/codebase-snapshot.js'

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'chan-snapshot-'))
}

describe('buildCodebaseSnapshot', () => {
  it('renders package.json, README and sorted top-level entries as ## sections', async () => {
    const cwd = tempDir()
    const pkg = JSON.stringify({ name: 'demo', version: '1.0.0' }, null, 2)
    await writeFile(join(cwd, 'package.json'), `${pkg}\n`)
    await writeFile(join(cwd, 'README.md'), '# Demo\n\nA demo project.\n')
    await mkdir(join(cwd, 'src'))
    await writeFile(join(cwd, 'CHANGELOG.md'), '# Changelog\n')

    const snapshot = await buildCodebaseSnapshot(cwd)

    expect(snapshot).toBe(
      [
        '## package.json',
        '',
        pkg,
        '',
        '## README',
        '',
        '# Demo',
        '',
        'A demo project.',
        '',
        '## Top-level entries',
        '',
        'CHANGELOG.md',
        'README.md',
        'package.json',
        'src/',
        '',
      ].join('\n')
    )
  })

  it('omits the package.json section without error when absent', async () => {
    const cwd = tempDir()
    await writeFile(join(cwd, 'README.md'), '# Only a readme.\n')
    await mkdir(join(cwd, 'lib'))

    const snapshot = await buildCodebaseSnapshot(cwd)

    expect(snapshot).not.toContain('## package.json')
    expect(snapshot).toContain('## README\n\n# Only a readme.')
    expect(snapshot).toContain('## Top-level entries\n\nREADME.md\nlib/')
  })

  it('omits the README section without error when absent', async () => {
    const cwd = tempDir()
    await writeFile(join(cwd, 'package.json'), '{"name":"demo"}\n')
    await writeFile(join(cwd, 'no-readme-here.txt'), 'x\n')

    const snapshot = await buildCodebaseSnapshot(cwd)

    expect(snapshot).not.toContain('## README')
    expect(snapshot).toContain('## package.json\n\n{"name":"demo"}')
    expect(snapshot).toContain('## Top-level entries\n\nno-readme-here.txt\npackage.json')
  })

  it('yields only an empty listing section for an empty directory', async () => {
    const snapshot = await buildCodebaseSnapshot(tempDir())

    expect(snapshot).toBe('## Top-level entries\n\n\n')
  })
})

describe('README resolution', () => {
  it.each(['README.md', 'readme.md', 'Readme.md', 'README'])(
    'includes the full README for the %s variant',
    async (name) => {
      const cwd = tempDir()
      await writeFile(join(cwd, name), `Content of ${name}.\n`)

      const snapshot = await buildCodebaseSnapshot(cwd)

      expect(snapshot).toContain(`## README\n\nContent of ${name}.`)
    }
  )

  it('prefers Readme.md over the extensionless README when both exist', async () => {
    const cwd = tempDir()
    await writeFile(join(cwd, 'README'), 'extensionless content\n')
    await writeFile(join(cwd, 'Readme.md'), 'mixed-case content\n')

    const snapshot = await buildCodebaseSnapshot(cwd)

    expect(snapshot).toContain('## README\n\nmixed-case content')
    expect(snapshot).not.toContain('extensionless content')
  })

  it('does not treat other README-named files as the README', async () => {
    const cwd = tempDir()
    await writeFile(join(cwd, 'README.txt'), 'not a readme variant\n')

    const snapshot = await buildCodebaseSnapshot(cwd)

    expect(snapshot).not.toContain('## README\n\nnot a readme')
    expect(snapshot).toContain('README.txt')
  })
})

describe('determinism', () => {
  it('produces identical output for identical directory contents created in different order', async () => {
    const first = tempDir()
    await writeFile(join(first, 'package.json'), '{"name":"demo"}\n')
    await mkdir(join(first, 'src'))
    await writeFile(join(first, 'README.md'), '# Demo\n')
    await writeFile(join(first, '.hidden'), 'x\n')

    const second = tempDir()
    await writeFile(join(second, '.hidden'), 'x\n')
    await writeFile(join(second, 'README.md'), '# Demo\n')
    await mkdir(join(second, 'src'))
    await writeFile(join(second, 'package.json'), '{"name":"demo"}\n')

    expect(await buildCodebaseSnapshot(second)).toBe(await buildCodebaseSnapshot(first))
  })

  it('produces identical output on repeated calls for the same directory', async () => {
    const cwd = tempDir()
    await writeFile(join(cwd, 'package.json'), '{"name":"demo"}\n')
    await mkdir(join(cwd, 'src'))

    expect(await buildCodebaseSnapshot(cwd)).toBe(await buildCodebaseSnapshot(cwd))
  })

  it('lists dotfiles and mixed-case names as-is in code-unit sorted order', async () => {
    const cwd = tempDir()
    await writeFile(join(cwd, 'z.txt'), 'z\n')
    await writeFile(join(cwd, 'a.txt'), 'a\n')
    await writeFile(join(cwd, 'B.txt'), 'B\n')
    await writeFile(join(cwd, '.hidden'), 'x\n')
    await mkdir(join(cwd, 'src'))

    const snapshot = await buildCodebaseSnapshot(cwd)

    expect(snapshot).toContain('## Top-level entries\n\n.hidden\nB.txt\na.txt\nsrc/\nz.txt')
  })
})
