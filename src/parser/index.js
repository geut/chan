import path from 'path';
import remark from 'remark';
import { read, write } from './fs';


const MARKERS = {
    INITIAL: 0,
    UNRELEASED: 3,
    CHANGES: 4
};

const SEPARATORS = {
    Added: 'Added',
    Changed: 'Changed',
    Fixed: 'Fixed',
    Security: 'Security',
    Deprecated: 'Deprecated',
    Removed: 'Removed'
};

const HEADINGS = new Set(Object.keys(SEPARATORS));

export default function parser(dir = process.cwd()) {
    const pathname = path.resolve(dir, 'CHANGELOG.md');
    const contents = read(pathname);
    return {
        remark,
        MARKERS,
        SEPARATORS,
        HEADINGS,
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
        changeHeaderExists(changeType, node) {
            return node.type === 'heading' &&
                node.depth === 3 &&
                node.children[0].value === changeType;
        },
        detectChangeHeader(changeType) {
            const childrens = this.root.children.slice(MARKERS.UNRELEASED, this.root.children.length - 1);
            let exists = false;
            let pos = MARKERS.UNRELEASED;
            for (let node of childrens) {
                if (node.type === 'heading' && node.depth === 2) {
                    break;
                }
                if (this.changeHeaderExists(changeType, node)) {
                    exists = true;
                    break;
                }
                pos++;
            }
            return { exists, pos };
        },
        change(changeType, value) {
            if (typeof changeType === 'undefined') throw new Error('A change type is required.');

            const changeHeader = this.detectChangeHeader(changeType);
            //let unchanged = this.root.children.slice(MARKERS.INITIAL, changeHeader.pos);
            let change = remark.parse(value);

            let unchanged = this.root.children.slice(MARKERS.INITIAL, changeHeader.pos + 2);
            if (!changeHeader.exists) {
                unchanged.push(this.createMDAST(`### ${changeType}`));
                change = change.children[0]; // list
                unchanged.push(change);
            } else {
                change = change.children[0].children[0]; // listItem
                //unchanged = this.root.children.slice(MARKERS.INITIAL, changeHeader.pos + 2);
                unchanged[changeHeader.pos + 1].children.push(change);
                changeHeader.pos += 2;
            }

            const previousVersions = this.root.children.slice(changeHeader.pos, this.root.children.length);
            // create the new root childrens
            let newRoot = [...unchanged, ...previousVersions];
            this.root.children = newRoot;
            return this.root;
        }
    };
}
