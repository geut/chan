const vfile = require('to-vfile');
const report = require('vfile-reporter');
const { initialize, addChanges, addRelease, getLastVersionRelease } = require('..');

(async () => {
  try {
    let file = await initialize(vfile.readSync(`${__dirname}/empty.md`));

    console.error(report(file, { quiet: true }));
    console.log(file.contents);

    file = await addChanges(vfile.readSync(`${__dirname}/used.md`), {
      changes: [
        { action: 'Security', value: 'alguna cosa' },
        {
          action: 'Changed',
          value: 'vaaamos',
          group: 'package2'
        },
        {
          version: '0.0.1',
          action: 'Fixed',
          value: 'fixed algo viejo',
          group: 'package1'
        }
      ]
    });

    console.error(report(file, { quiet: true }));
    console.log(file.contents);

    file = await addRelease(vfile.readSync(`${__dirname}/used.md`), {
      version: '0.0.5',
      url: 'someurl',
      yanked: false
    });

    console.error(report(file, { quiet: true }));
    console.log(file.contents);

    console.log(getLastVersionRelease(file));
  } catch (err) {
    console.log(err);
  }
})();
