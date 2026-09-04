import { join } from 'node:path'
import { chmod, mkdir, unlink, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { createLogger } from '../logger.js'
import { CHAN_DIR, HOOKS_DIRNAME, POST_COMMIT_FILENAME, hooksDir } from '../code-md.js'

const execFileAsync = promisify(execFile)

export const command = 'hook <action>'
export const description = 'Install or uninstall chan git hooks.'

export const builder = {
  action: {
    type: 'string',
    choices: ['install', 'uninstall'] as const,
    demandOption: true,
  },
  path: {
    alias: 'p',
    describe: 'Path to the git repository',
    type: 'string',
    default: '.',
  },
}

interface HookArgs {
  action: 'install' | 'uninstall'
  path: string
  verbose?: boolean
}

const POST_COMMIT_SCRIPT = `#!/bin/sh
# chan post-commit hook — analyze HEAD and append to .chan/code.md
chan analyze --auto
`

async function gitConfig(args: string[], cwd: string): Promise<void> {
  await execFileAsync('git', args, { cwd })
}

export async function handler({ action, path, verbose }: HookArgs) {
  const { success, info } = createLogger({ scope: 'hook', verbose })
  const cwd = path
  const hooksPath = hooksDir(cwd)

  if (action === 'install') {
    await mkdir(hooksPath, { recursive: true })
    const postCommitPath = join(hooksPath, POST_COMMIT_FILENAME)
    await writeFile(postCommitPath, POST_COMMIT_SCRIPT, { mode: 0o755 })
    await chmod(postCommitPath, 0o755)

    await gitConfig(['config', 'core.hooksPath', `${CHAN_DIR}/${HOOKS_DIRNAME}`], cwd)

    success(
      `Installed post-commit hook to ${CHAN_DIR}/${HOOKS_DIRNAME}/${POST_COMMIT_FILENAME} and set core.hooksPath.`
    )
    return
  }

  // uninstall
  try {
    await gitConfig(['config', '--unset', 'core.hooksPath'], cwd)
    info('Unset core.hooksPath (if it was set).')
  } catch {
    // core.hooksPath was not set — nothing to unset.
    info('core.hooksPath was not set — nothing to unset.')
  }

  const postCommitPath = join(hooksPath, POST_COMMIT_FILENAME)
  try {
    await unlink(postCommitPath)
  } catch {
    // hook file already absent.
  }

  success('Uninstalled chan hooks.')
}