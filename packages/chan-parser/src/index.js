import remark from 'remark';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import removePosition from 'unist-util-remove-position';
import emptySpaces from './empty-spaces';
import mtree from './mtree';

const remarkInstance = remark()
  .use(markdown)
  .use(stringify, {
    listItemIndent: '1'
  })
  .use(emptySpaces);

const Parser = {
  initialize(content) {
    this.content = content;
    this.createMDAST(this.content);
    this.root.children = this.createMDAST(this.content);
  },

  read(reader) {
    const content = reader.read();
    this.initialize(content);
  },

  createMDAST(value, forceArray = false) {
    const result = removePosition(remarkInstance.parse(value), true);
    if (result.children.length === 1 && !forceArray) {
      return result.children[0];
    }
    return result.children;
  },

  stringify(root = this.root) {
    return remarkInstance.stringify(root, {
      listItemIndent: '1'
    });
  },

  getMtree() {
    if (this.mtree) {
      return this.mtree;
    }

    this.mtree = mtree(this);
    return this.mtree;
  },

  change(type, value, options) {
    return this.getMtree().insert(type, value, options);
  },

  release(version, options) {
    return this.getMtree().version(version, options);
  },

  findRelease(version) {
    return this.getMtree().findRelease(version);
  },

  write(writer) {
    writer.write(this.stringify());
  }
};

function createParser() {
  return {
    ...Parser,
    remark: remarkInstance,
    root: removePosition(remarkInstance.parse(null), true)
  };
}

export default createParser;
