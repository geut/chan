import ChanParser from '@chan/chan-parser';
import buildWriter from '../lib/writer';
import { ChangelogNotExistsError } from '@chan/chan-errors';

const change = async (type, msg, group = false, { path, stdout } = {}) => {
  const parser = ChanParser(path);

  if (!parser.exists()) {
    throw new ChangelogNotExistsError({ path });
  }

  await parser.change(parser.SEPARATORS[type], msg, { group });

  const writer = buildWriter(parser, stdout);
  await writer.write();
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
