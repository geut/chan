import path from 'path';
import test, { afterEach, beforeEach } from 'ava';
import sinon from 'sinon';
import { FsWriter } from '../src/lib/writer';
import init from '../src/api/init';
import emptyTemplate from '../src/templates/empty';

import { ChangelogAlreadyExistsError } from '@chan/chan-errors';

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

const existentChangelogPath = path.join(__dirname, 'fixtures', 'initialized');

test.serial('>   Existent CHANGELOG.md (override: true)', async t => {
  await init(true, {
    path: existentChangelogPath,
    stdout: true
  });
  t.is(t.context.output, emptyTemplate);
});

test.serial('>   Existent CHANGELOG.md (override: false)', async t => {
  await t.throwsAsync(
    async () =>
      await init(false, {
        path: existentChangelogPath
      }),
    ChangelogAlreadyExistsError
  );
  t.pass();
});
