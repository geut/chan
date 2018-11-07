const options = {
  o: {
    alias: 'overwrite',
    describe: 'Overwrite the current CHANGELOG.md',
    type: 'boolean',
    default: false
  }
};

export default cli => {
  for (const [name, option] of Object.entries(options)) {
    cli.option(name, option);
  }
};
