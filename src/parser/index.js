import path from 'path';
import remark from 'remark';
import { read, write } from './fs';

export default function parser(dir = process.cwd()) {
    const pathname = path.resolve(dir, 'CHANGELOG.md');
    const contents = read(pathname);
    const parserOptions = {
        position: false
    };
    return {
        remark,
        root: remark.parse(contents, parserOptions),
        createMDAST(value) {
            const result = this.remark.parse(value, parserOptions);
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
            return this.remark.stringify(this.root, parserOptions);
        }
    };
}
