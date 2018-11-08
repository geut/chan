export default {
  'git-compare': {
    describe:
      'Overwrite the git url compare by default.\n e.g.: https://bitbucket.org/project/compare/<from>..<to>',
    type: 'string'
  },
  'group-changes': {
    describe: 'Group changes based on [<group>] prefix.',
    type: 'boolean',
    default: false
  }
};
