import { release } from '@chan/chan-core';
import { addCommand } from '../../lib/command';
import { registerOptions } from '../../lib/options';
import options from './options';

const handler = async ({ semver, path, groupChanges }) => {
  return await release({
    version: semver,
    folder: path,
    group: groupChanges
  });
};

const command = {
  command: 'release <semver>',
  describe:
    'Groups all your new features and marks a new release on your CHANGELOG.md.',
  builder: registerOptions(options),
  handler,
  success: `Version released`,
  fail: `Version cannot be released`
  // success: `Version ${this.version} released`,
  // fail: `Version ${this.version} cannot be released`
};

export default yargs => {
  addCommand(yargs, command);
};
