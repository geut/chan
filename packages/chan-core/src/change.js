import parser from '@chan/chan-parser';
import writer from './lib/writer';
import { ChangelogNotExistsError } from '@chan/chan-errors';

const change = async ({ type, msg, folder = process.cwd(), group }) => {
  const parserInstance = parser(folder);

  if (!parserInstance.exists()) {
    throw new ChangelogNotExistsError({ folder });
  }

  const write = writer({ parserInstance });
  await parserInstance.change(parserInstance.SEPARATORS[type], msg, { group });
  return await write();
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
