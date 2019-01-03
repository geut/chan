import fs from 'fs';
import { resolve } from 'path';

const fsWriter = {
  write(contents) {
    fs.writeFileSync(this.changelogPath, contents);
    return contents;
  }
};

function createFsWriter(path) {
  return {
    changelogPath: resolve(path || process.cwd(), 'CHANGELOG.md'),
    ...fsWriter
  };
}

export default createFsWriter;
