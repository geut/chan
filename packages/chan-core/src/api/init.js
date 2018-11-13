import ChanParser from '@chan/chan-parser';
import { ChangelogAlreadyExistsError } from '@chan/chan-errors';
import buildWriter from '../lib/writer';
import emptyTemplate from '../templates/empty';

const init = async (overwrite = false, { path, stdout } = {}) => {
  const parser = ChanParser(path);

  if (parser.exists() && !overwrite) {
    throw new ChangelogAlreadyExistsError({ path });
  }

  const m = parser.createMDAST;
  parser.root.children = m(emptyTemplate);
  const writer = buildWriter(parser, stdout);
  await writer.write();
};

export default init;
