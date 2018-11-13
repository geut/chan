import { addCommand } from '../../lib/command';
import { registerOptions } from '../../lib/options';
import options from './options';

const commands = [
  {
    name: 'added',
    command: 'added [msg]',
    describe: 'Writes your changelog indicating new stuff.'
  },
  {
    name: 'changed',
    command: 'changed [msg]',
    describe: 'Writes your changelog indicating updated stuff.'
  },
  {
    name: 'deprecated',
    command: 'deprecated [msg]',
    describe: 'Writes your changelog indicating deprecated stuff.'
  },
  {
    name: 'fixed',
    command: 'fixed [msg]',
    describe: 'Writes your changelog indicating fixed stuff.'
  },
  {
    name: 'removed',
    command: 'removed [msg]',
    describe: 'Writes your changelog indicating removed stuff.'
  },
  {
    name: 'security',
    command: 'security [msg]',
    describe: 'Writes your changelog indicating security upgrades.'
  }
];

const changeCommand = type => ({
  builder: registerOptions(options),
  async handler({ msg, group }, chanApi) {
    return await chanApi.change(type, msg, group);
  },
  success: `Change (type: ${type}) added to changelog`,
  fail: `Change (type: ${type}) cannot be added to changelog`,
  runningMsg: `Adding a new ${type} change to your changelog...`
});

export default yargs => {
  for (const command of Object.values(commands)) {
    addCommand(yargs, {
      ...command,
      ...changeCommand(command.name)
    });
  }
};
