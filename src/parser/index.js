import path from 'path';
import remark from 'remark';
import fs from 'fs';

export default function parser(dir = process.cwd()) {
    const pathname = path.resolve(dir, 'CHANGELOG.md');
    let contents = fs.readFileSync(pathname, 'utf8');

    return {
        remark,
        root: remark.parse(contents),
        add(message) {
            console.log('ADDED: ' + message);
        },
        stringify() {
            return this.remark.stringify(this.root);
        },
        write() {
            fs.writeFileSync(pathname, this.stringify());
        }
    };
}
