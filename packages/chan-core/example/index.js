const vfile = require('to-vfile');
const report = require('vfile-reporter');
const { initialize, addChanges, addRelease } = require('..');

(async () => {
  try {
    let file = await initialize(vfile.readSync(`${__dirname}/../__tests__/empty.md`));

    console.error(report(file, { quiet: true }));
    console.log(file.contents);

    file = await addChanges(vfile.readSync(`${__dirname}/../__tests__/used.md`), {
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

    file = await addRelease(vfile.readSync(`${__dirname}/../__tests__/used.md`), {
      version: '0.0.5',
      gitTemplate: 'https://github.com/geut/chan/compare/[prev]...[next]',
      gitBranch: 'HEAD',
      yanked: false
    });

    console.error(report(file, { quiet: true }));
    console.log(file.contents);

    file = await addRelease(vfile.readSync(`${__dirname}/../__tests__/prereleases.md`), {
      version: '0.0.2',
      gitTemplate: 'https://github.com/olivierlacan/keep-a-changelog/compare/[prev]...[next]',
      gitBranch: 'master',
      mergePrerelease: true
    });

    console.error(report(file, { quiet: true }));
    console.log(file.contents);
  } catch (err) {
    console.log(err);
  }
})();
