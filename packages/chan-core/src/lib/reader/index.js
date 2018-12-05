import {
  NoReaderProvidedError,
  ChangelogNotExistsOnPathError,
  ChangelogNotExistsError
} from '@chan/chan-errors';
import createFsReader from './fs-reader';

export { default as createFsReader } from './fs-reader';

function getReader(path, reader) {
  if (!path && !reader) {
    throw new NoReaderProvidedError();
  }

  let err;
  if (path) {
    reader = createFsReader(path);
    err = () => new ChangelogNotExistsOnPathError({ path });
  } else {
    err = () => new ChangelogNotExistsError();
  }

  if (!reader.exists()) {
    throw err();
  }

  return reader;
}

export default getReader;
