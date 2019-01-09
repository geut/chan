const { resolve } = require('path');
const toVFile = require('to-vfile');
const { addChanges } = require('@geut/chan-core');

const report = require('../util/report');
const openInEditor = require('../util/open-in-editor');

const actions = [
  { command: 'added', description: 'Added for new features.' },
  { command: 'changed', description: 'Changed for changes in existing functionality.' },
  { command: 'deprecated', description: 'Deprecated for soon-to-be removed features.' },
  { command: 'removed', description: 'Removed for now removed features.' },
  { command: 'fixed', description: 'Fixed for any bug fixes.' },
  { command: 'security', description: 'Security in case of vulnerabilities.' }
];

const createHandler = action => async argv => {
  let { message, path, group } = argv;
  let file = toVFile();

  try {
    file = await toVFile.read(resolve(path, 'CHANGELOG.md'));
    if (!message) {
      message = await openInEditor();

      if (!message || message.length === 0) {
        file.info('Nothing to change.', null, action);
        return report({ file, argv });
      }
    }

    await addChanges(file, { changes: [{ action, group, value: message }] });
    await toVFile.write(file);
    file.info('Added new changes on your changelog.', null, action);
    report({ file, argv });
  } catch (err) {
    report({ file, argv, err });
  }
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
