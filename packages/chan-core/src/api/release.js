import parser from '@chan/chan-parser';
import writer from '../lib/writer';
import {
  ChangelogNotExistsError,
  VersionAlreadyExistsError
} from '@chan/chan-errors';

const release = async ({
  version,
  path = process.cwd(),
  group,
  gitCompare
}) => {
  const parserInstance = parser(path);

  if (!parserInstance.exists()) {
    throw new ChangelogNotExistsError({ path });
  }

  if (parserInstance.findRelease(version)) {
    throw new VersionAlreadyExistsError({ version });
  }

  const write = writer({ parserInstance });
  await parserInstance.release(version, { group, gitCompare });
  return await write();
};

export default release;
