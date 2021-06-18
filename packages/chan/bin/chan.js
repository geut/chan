#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { config } from '../src/config.js'
import { commands } from '../src/commands/index.js'

yargs(hideBin(process.argv))
  .config(config)
  .pkgConf('chan')
  .command(commands)
  .options({
    verbose: {
      describe: 'Show more info on error',
      type: 'boolean',
      global: true
    },
    stdout: {
      describe: 'Show the output to the stdout',
      type: 'boolean'
    }
  })
  .demandCommand()
  .help()
  .version()
  .argv
