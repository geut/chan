import fs from 'fs';
import { resolve } from 'path';

const fsReader = {
  exists() {
    return fs.existsSync(this.pathname);
  },

  read() {
    return fs.readFileSync(this.pathname, 'utf8');
  }
};

function createFsReader(path = process.cwd()) {
  return {
    pathname: resolve(path, 'CHANGELOG.md'),
    ...fsReader
  };
}

export default createFsReader;
