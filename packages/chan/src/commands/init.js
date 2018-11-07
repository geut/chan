import registerOptions from '../options/init';
import { init } from '@chan/chan-core';
// import { success, fail } from '../lib/logger';
import { addCommand } from '../lib/command';

const command = {
  command: 'init',
  describe:
    'Creates a CHANGELOG.md if it does not exists. Chan will work with this file.',
  builder: registerOptions,
  handler: async ({ overwrite, path }) => {
    return await init({ overwrite, folder: path });
  },
  success: () => 'CHANGELOG.md initialized successfully',
  fail: () => 'CHANGELOG.md cannot be initialized'
};

export default cli => {
  addCommand(cli, command);
};
