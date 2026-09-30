import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const withGlobal = process.argv.includes('--global')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
    ...options,
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    if (options.stdio === 'pipe') {
      process.stderr.write(result.stdout ?? '')
      process.stderr.write(result.stderr ?? '')
    }
    throw new Error(`${command} ${args.join(' ')} exited ${result.status}`)
  }
  return result
}

function runAllowFail(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
    ...options,
  })
}

const binJs = join(repoRoot, 'packages', 'chan', 'dist', 'src', 'bin.js')
try {
  await readFile(binJs)
} catch {
  throw new Error('Build first: dist/src/bin.js is missing. Run npm run build.')
}

const packDir = await mkdtemp(join(tmpdir(), 'chan-pack-'))
const smokeDir = await mkdtemp(join(tmpdir(), 'chan-smoke-'))

try {
  run(npm, ['pack', '--quiet', '--workspaces', '--pack-destination', packDir], { stdio: 'pipe' })

  const tarballs = (await readdir(packDir)).filter(name => name.endsWith('.tgz')).toSorted()
  if (tarballs.length !== 7) {
    throw new Error(`Expected 7 tarballs, got ${tarballs.length}: ${tarballs.join(', ')}`)
  }

  const patterns = {
    '@geut/chan': /^geut-chan-\d/,
    '@geut/chan-ai': /^geut-chan-ai-/,
    '@geut/chan-core': /^geut-chan-core-/,
    '@geut/chan-stringify': /^geut-chan-stringify-/,
    '@geut/chast': /^geut-chast-/,
    '@geut/git-url-parse': /^geut-git-url-parse-/,
    '@geut/remark-chan': /^geut-remark-chan-/,
  }
  const byName = Object.fromEntries(
    Object.entries(patterns).map(([name, pattern]) => [name, tarballs.find(file => pattern.test(file))])
  )
  for (const [name, file] of Object.entries(byName)) {
    if (!file) {
      throw new Error(`Missing tarball for ${name}`)
    }
  }

  const fileDep = name => `file:${join(packDir, byName[name])}`
  const overrides = Object.fromEntries(Object.keys(byName).map(name => [name, fileDep(name)]))

  await writeFile(
    join(smokeDir, 'package.json'),
    JSON.stringify(
      {
        private: true,
        dependencies: Object.fromEntries(Object.keys(byName).map(name => [name, fileDep(name)])),
        overrides,
      },
      null,
      2
    )
  )
  await writeFile(
    join(smokeDir, 'consumer.ts'),
    `import { addChanges } from '@geut/chan-core'\nexport const add = addChanges\n`
  )
  await writeFile(
    join(smokeDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          target: 'es2023',
        },
        files: ['consumer.ts'],
      },
      null,
      2
    )
  )

  run(npm, ['install', '--silent'], { cwd: smokeDir, stdio: 'pipe' })

  const gitInit = runAllowFail('git', ['init'], { cwd: smokeDir, stdio: 'pipe' })
  if (gitInit.status !== 0) {
    const stderr = `${gitInit.stderr ?? ''}`
    const xcodeStub = /license agreements/i.test(stderr)
    if (!xcodeStub) {
      process.stderr.write(stderr)
      throw new Error(`git init exited ${gitInit.status}`)
    }
    // macOS /usr/bin/git is an Xcode stub until the license is accepted.
    // chan only needs a .git directory; URL parsing fails soft without a remote.
    await mkdir(join(smokeDir, '.git', 'refs', 'heads'), { recursive: true })
    await writeFile(join(smokeDir, '.git', 'HEAD'), 'ref: refs/heads/main\n')
    await writeFile(
      join(smokeDir, '.git', 'config'),
      '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n'
    )
    console.warn('git init failed (Xcode license); created a minimal .git directory instead')
  }

  const chan = join(smokeDir, 'node_modules', '@geut', 'chan', 'dist', 'src', 'bin.js')
  const node = process.execPath
  run(node, [chan, '--help'], { cwd: smokeDir })
  run(node, [chan, 'init'], { cwd: smokeDir })
  run(node, [chan, 'added', 'smoke entry'], { cwd: smokeDir })
  run(node, [chan, 'release', '0.1.0'], { cwd: smokeDir })
  run(node, [chan, 'show', '0.1.0'], { cwd: smokeDir })

  const failed = runAllowFail(node, [chan, 'release', 'not-a-version'], { cwd: smokeDir })
  if (failed.status === 0) {
    throw new Error('chan release not-a-version exited 0')
  }

  const tsgo = join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsgo.cmd' : 'tsgo')
  run(tsgo, ['--noEmit', '-p', join(smokeDir, 'tsconfig.json')], { cwd: smokeDir })

  if (withGlobal) {
    const prefix = await mkdtemp(join(tmpdir(), 'chan-global-'))
    try {
      run(npm, ['install', '--prefix', prefix, '-g', ...tarballs.map(name => join(packDir, name))])
      const globalChan = join(
        prefix,
        process.platform === 'win32' ? 'chan.cmd' : 'bin/chan'
      )
      run(globalChan, ['--help'], { cwd: smokeDir })
    } finally {
      await rm(prefix, { recursive: true, force: true })
    }
  }

  console.log('smoke install ok')
} finally {
  await rm(packDir, { recursive: true, force: true })
  await rm(smokeDir, { recursive: true, force: true })
}
