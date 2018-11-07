import { init } from '@chan/chan-core';
import { addCommand } from '../../lib/command';
import { registerOptions } from '../../lib/options';
import options from './options';

const command = {
  command: 'init',
  describe:
    'Creates a CHANGELOG.md if it does not exists. Chan will work with this file.',
  builder: registerOptions(options),
  handler: async ({ overwrite, path }) => {
    return await init({ overwrite, folder: path });
  },
  success: 'CHANGELOG.md initialized successfully',
  fail: 'CHANGELOG.md cannot be initialized'
};

export default cli => {
  addCommand(cli, command);
};
