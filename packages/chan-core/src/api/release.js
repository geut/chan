import { VersionAlreadyExistsError } from '@chan/chan-errors';
import createParser from '@chan/chan-parser/src';
import getReader from '../lib/reader';
import { createFsWriter, createStdOutWriter } from '../lib/writer';

const release = (
  version,
  groupChanges,
  gitCompare,
  { path, stdout, reader = null } = {}
) => {
  reader = getReader(path, reader);
  const parser = createParser();
  parser.read(reader);

  if (parser.findRelease(version)) {
    throw new VersionAlreadyExistsError({ version });
  }

  parser.release(version, { group: groupChanges, gitCompare });

  const writer = stdout ? createStdOutWriter() : createFsWriter(path);
  parser.write(writer);
};

export default release;
