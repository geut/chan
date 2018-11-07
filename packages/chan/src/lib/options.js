export const registerOptions = options => cli => {
  for (const [name, { global, ...option }] of Object.entries(options)) {
    const opt = cli.option(name, option);
    if (global) {
      opt.global(name);
    }
  }
};
