const HEADINGS = new Set([
    'Added',
    'Updated',
    'Removed'
]);

function isUnreleased(node) {
    return node.type === 'heading' && HEADINGS.has(node.children[0].value) || node.type === 'list';
}

export default function () {
    return {
        command: 'release [version]',
        describe: 'Groups all your new features and marks a new release on your CHANGELOG.md.',
        handler(parser, argv, write) {
            if ( !parser.exists() ) {
                throw new Error('CHANGELOG.md does not exists. You can run: chan init in order to create a fresh new one.');
            }

            const version = argv.version;

            if (!version) {
                throw new Error('Missing argument: version.');
            }

            // do nothing if unreleased is empty.
            if (parser.root.children.length <= parser.MARKERS.UNRELEASED) return;

            const m = parser.createMDAST;
            // the header part of the CHANGELOG
            const unchanged = parser.root.children.slice(parser.MARKERS.INITIAL, parser.MARKERS.UNRELEASED);
            // Unreleased section "childrens"
            const childrens = parser.root.children.slice(parser.MARKERS.UNRELEASED, parser.root.children.length - 1);

            let pos = parser.MARKERS.UNRELEASED;
            const unreleased = [];
            for (let node of childrens) {
                if (node.type === 'heading' && node.depth === 2) {
                    break;
                }
                if (isUnreleased(node)) {
                    unreleased.push(node);
                } else {
                    break;
                }
                pos++;
            }

            if (pos === parser.MARKERS.UNRELEASED) return;
            const previousVersions = parser.root.children.slice(pos, parser.root.children.length);
            const date = new Date();
            const newVersion = m(`## [${version}] - ${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`);
            let newRoot = [...unchanged, newVersion, ...unreleased, ...previousVersions ];
            // update the rootz
            parser.root.children = newRoot;
            write();
        }
    };
}
