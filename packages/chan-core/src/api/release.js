import ChanParser from '@chan/chan-parser';
import buildWriter from '../lib/writer';
import {
  ChangelogNotExistsError,
  VersionAlreadyExistsError
} from '@chan/chan-errors';

const release = async (
  version,
  groupChanges,
  gitCompare,
  { path, stdout } = {}
) => {
  const parser = ChanParser(path);

  if (!parser.exists()) {
    throw new ChangelogNotExistsError({ path });
  }

  if (parser.findRelease(version)) {
    throw new VersionAlreadyExistsError({ version });
  }

  await parser.release(version, { group: groupChanges, gitCompare });

  const writer = buildWriter(parser, stdout);
  await writer.write();
};

export default release;
