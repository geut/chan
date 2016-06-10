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
                this.root.children[3].children[0] === 'object' &&
                this.root.children[3].children[0].type === 'heading' &&
                this.root.children[3].children[0].children[0] &&
                this.root.children[3].children[0].children[0].value === 'Added';
        },
        added(value) {
            let result = false;
            if (!this.addedHeaderExists()) {
                console.log('added::inject::header')
                result = inject('Unreleased', this.root, '### Added\n');
                console.log('added::inject::header::result', result)
            } else {
                result = inject('Added', this.root, value);
            }
            console.log(this.root)
            return result;
        }
    };
}
