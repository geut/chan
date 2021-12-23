import { actionCommands } from './actions.js'
import * as ghRelease from './gh-release.js'
import * as init from './init.js'
import * as release from './release.js'
import * as show from './show.js'

export const commands = [
  init,
  ...actionCommands,
  release,
  ghRelease,
  show
]
