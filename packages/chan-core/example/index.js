const unified = require('unified');
const markdown = require('remark-parse');
const vfile = require('to-vfile');
const report = require('vfile-reporter');
const remarkToChan = require('@geut/remark-chan');
const stringify = require('@geut/chan-stringify');
const { initialize, addChanges, addRelease } = require('..');

(async () => {
  try {
    let file = await unified()
      .use(markdown)
      .use(remarkToChan)
      .use(initialize)
      .use(stringify)
      .process(vfile.readSync(`${__dirname}/empty.md`));

    console.error(report(file, { quiet: true }));
    console.log(file.contents);

    file = await unified()
      .use(markdown)
      .use(remarkToChan)
      .use(addChanges, [
        { action: 'Security', value: 'alguna cosa' },
        {
          action: 'Changed',
          value: 'vaaamos',
          group: 'package1'
        },
        {
          version: '0.0.1',
          action: 'Fixed',
          value: 'fixed algo viejo',
          group: 'package1'
        }
      ])
      .use(addRelease, { version: '0.0.5', url: 'someurl', yanked: false })
      .use(stringify)
      .process(vfile.readSync(`${__dirname}/used.md`));

    console.error(report(file, { quiet: true }));
    console.log(file.contents);
  } catch (err) {
    console.log(err);
  }
})();
