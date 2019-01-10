const { resolve } = require('path');
const toVFile = require('to-vfile');

const { addChanges } = require('@geut/chan-core');

const { createLogger } = require('../util/logger');
const openInEditor = require('../util/open-in-editor');

const actions = [
  { command: 'added', description: 'Added for new features.' },
  { command: 'changed', description: 'Changed for changes in existing functionality.' },
  { command: 'deprecated', description: 'Deprecated for soon-to-be removed features.' },
  { command: 'removed', description: 'Removed for now removed features.' },
  { command: 'fixed', description: 'Fixed for any bug fixes.' },
  { command: 'security', description: 'Security in case of vulnerabilities.' }
];

const createHandler = action => async ({ message, path, group, verbose }) => {
  const { report, success, info } = createLogger({ scope: action, verbose });

  try {
    const file = await toVFile.read(resolve(path, 'CHANGELOG.md'));
    if (!message) {
      message = await openInEditor();

      if (!message || message.length === 0) {
        return info('Nothing to change.');
      }
    }

    await addChanges(file, { changes: [{ action, group, value: message }] });
    await toVFile.write(file);
    report(file);
  } catch (err) {
    report(err);
  }

  success('Added new changes on your changelog.');
};

module.exports = Object.values(actions).map(action => {
  return {
    command: `${action.command} [message]`,
    description: action.description,
    builder: {
      path: {
        alias: 'p',
        describe: 'Path of the CHANGELOG.md',
        type: 'string',
        default: '.'
      },
      g: {
        alias: 'group',
        describe: 'Prefix change with [<group>]. This allows to group changes on release time.',
        type: 'string'
      }
    },
    handler: createHandler(action.command)
  };
});
