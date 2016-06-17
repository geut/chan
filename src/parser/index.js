import path from 'path';
import remark from 'remark';
import inject from 'mdast-util-inject';
import { read, write } from './fs';

export default function parser(dir = process.cwd()) {
    const pathname = path.resolve(dir, 'CHANGELOG.md');
    const contents = read(pathname);
    return {
        remark,
        root: remark.parse(contents),
        createMDAST(value) {
            const result = remark.parse(value);
            if (result.children.length === 1) {
                return result.children[0];
            }
            return result.children;
        },
        exists() {
            return contents !== null;
        },
        write() {
            return write(pathname, this.stringify());
        },
        stringify() {
            return this.remark.stringify(this.root);
        },
        addedHeaderExists() {
            return this.root.children[3] &&
                this.root.children[3].type === 'heading' &&
                this.root.children[3].children[0] &&
                this.root.children[3].children[0].value === 'Added';
        },
        unreleased() {
            if (!(this.root.children[4] && this.root.children[4].type === 'list')) {
                // probably we should create it?
                return false;
            }
            return this.root.children[4];
        },
        added(value) {
            let result = false;
            if (!this.addedHeaderExists()) {
                inject('Unreleased', this.root, remark.parse('### Added\n'));
            }
            const unreleasedAST = this.unreleased();
            if ( unreleasedAST ) {
                const toAdd = remark.parse(value);
                unreleasedAST.children.push(toAdd.children[0].children[0]); // add 'each' children.children?
                const astToString = remark.stringify(unreleasedAST);
                result = inject('Added', this.root, remark.parse(astToString));
            } else {
                result = inject('Added', this.root, remark.parse(value));
            }
            return result;
        }
    };
}
