import { actionCommands } from './actions.js'
import * as auto from './auto.js'
import * as ghRelease from './gh-release.js'
import * as hook from './hook.js'
import * as init from './init.js'
import * as release from './release.js'
import * as show from './show.js'
import * as analyze from './analyze.js'

export const commands = [
  init,
  ...actionCommands,
  auto,
  release,
  ghRelease,
  show,
  hook,
  analyze,
]