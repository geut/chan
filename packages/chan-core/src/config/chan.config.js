export default {
  path: process.cwd(),
  stdout: false,
  init: {
    overwrite: false
  },
  change: {
    group: false
  },
  release: {
    groupChanges: false,
    gitCompare: null
  }
};
