import fs from 'fs';
import path from 'path';
import remark from 'remark';

const detectChangelog = function detectChangelog(pathname) {
    const filePath = path.resolve(pathname, 'CHANGELOG.md');
    let changelogExists = false;
    try {
        changelogExists = fs.accessSync(filePath, fs.R_OK | fs.W_OK);
        changelogExists = true;
    } catch (e) { }
    return changelogExists;
};

export default function parser(dir = process.cwd()) {


    return {
        remark,
        root: {},
        contents: '',
        pathname: path.resolve(dir, 'CHANGELOG.md'),
        parse() {
            this.root = remark.parse(this.contents);
        },
        add(message) {
            console.log('ADDED: ' + message);
        },
        stringify() {
            return this.remark.stringify(this.root);
        },
        exists() {
            return detectChangelog(dir);
        },
        read() {
            this.contents = fs.readFileSync(this.pathname, 'utf8');
        },
        write(data, userPath = this.pathname) {
            fs.writeFileSync( userPath, data );
        }
    };
}
