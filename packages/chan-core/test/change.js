import path from 'path';
import test, { afterEach, beforeEach } from 'ava';
import sinon from 'sinon';
import { FsWriter } from '../src/lib/writer';
import change from '../src/api/change';
import emptyTemplate from '../src/templates/empty';
import { TYPE } from '../src/api/change';
import ChanParser from '@chan/chan-parser';

// import { ChangelogAlreadyExistsError } from '@chan/chan-errors';

beforeEach(t => {
  t.context.output = '\n';
  sinon.stub(FsWriter.prototype, 'write').callsFake(null);
  sinon.stub(process.stdout, 'write').callsFake(data => {
    t.context.output += data;
  });
});

afterEach.always(() => {
  FsWriter.prototype.write.restore();
  process.stdout.write.restore();
});

const initializedChangelogPath = path.join(
  __dirname,
  'fixtures',
  'initialized'
);

const releasedChangelogPath = path.join(__dirname, 'fixtures', 'released');
const expectedChangeAlreadyReleasedPath = path.join(
  __dirname,
  'expected',
  'change',
  'already-released'
);

const globalOptions = {
  path: initializedChangelogPath,
  stdout: true
};

let changesToWrite = {};

for (const typeName in TYPE) {
  const type = TYPE[typeName];

  changesToWrite[type] = `New ${type} change to this CHANGELOG`;

  test.serial(`>   Adds a change (${type}) to an empty changelog`, async t => {
    await change(type, changesToWrite[type], false, globalOptions);
    t.is(
      t.context.output,
      `${emptyTemplate}### ${type.charAt(0).toUpperCase()}${type.slice(1)}\n- ${
        changesToWrite[type]
      }\n`
    );
  });

  test.serial(
    `>   Adds a change (${type}) to an empty changelog with a group.`,
    async t => {
      await change(type, changesToWrite[type], 'some-group', globalOptions);
      t.is(
        t.context.output,
        `${emptyTemplate}### ${type.charAt(0).toUpperCase()}${type.slice(
          1
        )}\n- [some-group] ${changesToWrite[type]}\n`
      );
    }
  );
}

test.serial(
  `>   Adds a change (added) to an already released changelog`,
  async t => {
    const parser = ChanParser(expectedChangeAlreadyReleasedPath);

    await change('fixed', 'Some change type fixed', false, {
      path: releasedChangelogPath,
      stdout: true
    });

    t.is(t.context.output, '\n' + parser.stringify());
  }
);
