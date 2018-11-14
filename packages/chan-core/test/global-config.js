import path from 'path';
import test, { afterEach, beforeEach } from 'ava';
import sinon from 'sinon';
import { FsWriter, StdOutWriter } from '../src/lib/writer';
import init from '../src/api/init';
import emptyTemplate from '../src/templates/empty';

import { ChangelogAlreadyExistsError } from '@chan/chan-errors';

const StdOutWriterProtoWrite = StdOutWriter.prototype.write;

beforeEach(t => {
  t.context.output = '\n';
  sinon.stub(FsWriter.prototype, 'write').callsFake(null);
  sinon.stub(StdOutWriter.prototype, 'write').callsFake(StdOutWriterProtoWrite);
  sinon.stub(process.stdout, 'write').callsFake(data => {
    t.context.output += data;
  });
});

afterEach.always(() => {
  FsWriter.prototype.write.restore();
  StdOutWriter.prototype.write.restore();
  process.stdout.write.restore();
});

const existentChangelogPath = path.join(__dirname, 'fixtures', 'initialized');

test.serial('>   Custom path', async t => {
  await t.throwsAsync(
    async () =>
      await init(false, {
        path: existentChangelogPath
      }),
    ChangelogAlreadyExistsError
  );
});

test.serial('>   Output as stdout', async t => {
  await init(false, { stdout: true });
  t.false(FsWriter.prototype.write.called);
  t.true(StdOutWriter.prototype.write.called);
  t.is(t.context.output, emptyTemplate);
});

test.serial('>   Output as type file', async t => {
  await init();
  t.true(FsWriter.prototype.write.called);
  t.false(StdOutWriter.prototype.write.called);
});
