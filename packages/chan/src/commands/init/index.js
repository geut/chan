import { addCommand } from '../../lib/command';
import { registerOptions } from '../../lib/options';
import options from './options';

const command = {
  command: 'init',
  describe:
    'Creates a CHANGELOG.md if it does not exists. Chan will work with this file.',
  builder: registerOptions(options),
  handler: ({ overwrite }, chanApi) => {
    return chanApi.init(overwrite);
  },
  success: 'CHANGELOG.md initialized successfully',
  fail: 'CHANGELOG.md cannot be initialized',
  runningMsg: `Initializing your changelog...`
};

export default yargs => {
  addCommand(yargs, command);
};
