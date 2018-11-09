import path from 'path';
import remark from 'remark';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import removePosition from 'unist-util-remove-position';
import { read, write } from './fs';
// import emptySpaces from './empty-spaces';
import mtree from './mtree';

const SEPARATORS = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  security: 'Security',
  deprecated: 'Deprecated',
  removed: 'Removed'
};

const remarkInstance = remark()
  .use(markdown)
  .use(stringify, {
    listItemIndent: '1'
  });

export default function parser(dir = process.cwd()) {
  let _mtree;

  const pathname = path.resolve(dir, 'CHANGELOG.md');
  const contents = read(pathname);
  return {
    remark: remarkInstance,
    SEPARATORS,
    root: removePosition(remarkInstance.parse(contents), true),
    createMDAST(value, forceArray = false) {
      const result = removePosition(remarkInstance.parse(value), true);
      if (result.children.length === 1 && !forceArray) {
        return result.children[0];
      }
      return result.children;
    },
    exists() {
      return contents !== null;
    },
    write(content = this.stringify()) {
      return write(pathname, content);
    },
    stringify(root = this.root) {
      return remarkInstance.stringify(root);
    },
    getMTREE() {
      if (_mtree) {
        return _mtree;
      }
      _mtree = mtree(this);
      return _mtree;
    },
    change(type, value, options) {
      return this.getMTREE().insert(type, value, options);
    },
    release(version, options) {
      return this.getMTREE().version(version, options);
    },
    findRelease(version) {
      return this.getMTREE().findRelease(version);
    }
  };
}
