import createParser from '@geut/chan-parser';
import { createFsWriter, createStdOutWriter } from '../lib/writer';
import getReader from '../lib/reader';

const change = (
  type,
  msg,
  group = false,
  { path, stdout, reader = null } = {}
) => {
  reader = getReader(path, reader);

  const parser = createParser();
  parser.initialize(reader.read());

  parser.change(type, msg, { group });

  const writer = stdout ? createStdOutWriter() : createFsWriter(path);
  parser.write(writer);
};

export default change;

export const TYPE = {
  ADDED: 'added',
  CHANGED: 'changed',
  FIXED: 'fixed',
  SECURITY: 'security',
  DEPRECATED: 'deprecated',
  REMOVED: 'removed'
};
