import createParser from '@chan/chan-parser';
import { ChangelogAlreadyExistsError } from '@chan/chan-errors';
import { createFsWriter, createStdOutWriter } from '../lib/writer';
import createFsReader from '../lib/reader/fs-reader';
import emptyTemplate from '../templates/empty';

const init = (overwrite = false, { path, stdout } = {}) => {
  if (path) {
    const reader = createFsReader(path);

    if (!overwrite && reader.exists()) {
      throw new ChangelogAlreadyExistsError({ path });
    }
  }

  const writer = stdout ? createStdOutWriter() : createFsWriter(path);

  const parser = createParser();
  parser.initialize(emptyTemplate);
  parser.write(writer);
};

export default init;
