#!/usr/bin/env node

import yargs, { type CommandModule } from 'yargs'
import { hideBin } from 'yargs/helpers'

import { loadConfig } from './config.js'
import { commands } from './commands/index.js'

void yargs(hideBin(process.argv))
  .config(loadConfig())
  .pkgConf('chan')
  .command(commands as unknown as CommandModule<{}, unknown>[])
  .options({
    verbose: {
      describe: 'Show more info on error',
      type: 'boolean' as const,
      global: true,
    },
    stdout: {
      describe: 'Show the output to the stdout',
      type: 'boolean' as const,
    },
  })
  .demandCommand()
  .help()
  .version().argv