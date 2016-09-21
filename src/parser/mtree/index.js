import now from './lib/now';
import gitUrlCompare from './lib/git-url-compare';

const MARKERS = {
    INITIAL: 0,
    UNRELEASED: 3
};

const STAGES = {
    RELEASE: 0,
    DEFINITION: 1
};

const LINE = '\n';
const BREAK = LINE + LINE;

const TPL = {
    UNRELEASED: '## [Unreleased]',
    H3: '### <text>',
    VERSION: '## [<version>] - <date>',
    LI: '- <text>',
    DEFINITION: '[<version>]: <git-compare>'
};

const REGEX_GET_VERSION = /##\s\[?([0-9\.]*)\]?\s-/g;

function processRelease(release, node, elem, stringify, m) {
    if (elem.type === 'heading') {
        node = {};
        node.text = stringify(elem.children[0]);
        node.children = [];
        release.nodes.push(node);
    } else  {
        const mLI = m('- ');
        for (let li of elem.children) {
            mLI.children[0] = li;
            node.children.push({
                text: stringify(mLI).slice(2)
            });
        }

    }
    release.len++;

    return node;
}

function decode(parser) {
    const children = parser.root.children;
    const stringify = parser.stringify;
    const m = parser.createMDAST;

    const that = {
        releases: [
            {
                text: TPL.UNRELEASED,
                start: MARKERS.UNRELEASED,
                len: 1,
                nodes: []
            }
        ],
        definitions: {
            nodes: []
        }
    };

    let node;
    let pos = MARKERS.UNRELEASED;
    let currentStage = STAGES.RELEASE;

    for (let elem of children.slice(MARKERS.UNRELEASED + 1)) {
        if (elem.type === 'heading' && elem.depth === 2) {
            const release = {
                text: stringify(elem),
                start: pos,
                len: 1,
                nodes: []
            };
            that.releases.push(release);
            pos++;
            continue;
        } else if (elem.type === 'definition') {
            currentStage = STAGES.DEFINITION;
        }

        if (currentStage === STAGES.RELEASE) {
            node = processRelease(that.releases[that.releases.length - 1], node, elem, stringify, m);
        } else {
            if (that.definitions.start === undefined) {
                that.definitions.start = pos;
            }
            that.definitions.nodes.push({
                text: stringify(elem)
            });
        }
        pos++;
    }

    return that;
}

function compileRelease(release = 0, children, m, version = null) {
    let tpl = this.releases[release].nodes.map((node) => {
        return TPL.H3.replace('<text>', node.text) + LINE + node.children.reduce((result, li) => {
            return result +
                LINE +
                TPL.LI.replace(
                    '<text>',
                    li.text.split('\n').map((line, i) => {
                        line = line.trim();
                        if (line.length > 0 && i > 0) {
                            return '  ' + line;
                        }
                        return line;
                    }).join('\n')
                );
        }, '');
    }).join(BREAK);

    if (version) {
        let tplVersion = TPL.VERSION
            .replace('<version>', version)
            .replace('<date>', now());

        if (this.releases.length === 1) {
            tplVersion = tplVersion.replace(/(\[|\])/g, '');
        } else if (this.releases[release].nodes.length === 0) {
            tplVersion += ' [YANKED]';
        }

        tpl = TPL.UNRELEASED +
            LINE +
            tplVersion +
            LINE +
            tpl;
    } else {
        tpl = this.releases[release].text + LINE + tpl;
    }

    const len = this.releases[release].len;

    const tplParsed = m(tpl);
    this.releases[release].len = tplParsed.length;
    children.splice(this.releases[release].start, len, ...tplParsed);

    let left = this.releases[release];
    if (this.releases.length > 1) {
        this.releases.slice(release + 1).forEach((r) => {
            r.start = left.start + left.len;
            left = r;
        });
    }

    this.definitions.start = left.start + left.len;

    return tpl;
}

function findHeaderOrCreate(type) {
    let node;
    for (let value of this.releases[0].nodes) {
        if (value.text.toLowerCase().trim() === type.toLowerCase().trim()) {
            node = value;
            break;
        }
    }
    if (!node) {
        const text = type.toLowerCase().trim();
        node = {
            text: text[0].toUpperCase() + text.substr(1, text.length),
            children: []
        };

        this.releases[0].nodes.push(node);

        this.releases[0].nodes.sort((a, b) => a.text.localeCompare(b.text));
    }

    return node;
}

function addDefinition(version = 'unreleased', gitCompare = null) {
    const that = this;
    return gitUrlCompare(gitCompare)
        .then((url) => {
            let def = TPL.DEFINITION.replace('<git-compare>', url);

            if (that.definitions.nodes.length > 0) {
                const oldNode = that.definitions.nodes[0];
                oldNode.text = oldNode.text
                    .replace('HEAD', `v${version}`)
                    .replace('unreleased', version);
            }

            that.definitions.nodes.splice(0, 0, {
                text: def
                    .replace('<version>', 'unreleased')
                    .replace('<from>', `v${version}`)
                    .replace('<to>', 'HEAD')
            });

            return Promise.resolve();
        });
}

function compileDefinitions(children, m) {
    const tpl = this.definitions.nodes.map((node) => {
        return node.text;
    }).join(LINE);

    const tplParsed = m(tpl, true);
    const end = children.length - this.definitions.start;

    children.splice(this.definitions.start, end, ...tplParsed);
}

export default function mtree(parser) {
    const gitCompare = parser.gitCompare;
    const that = Object.assign({}, decode(parser));

    that.compileRelease = function (release) {
        return compileRelease.call(this, release, parser.root.children, parser.createMDAST);
    };

    that.compileUnreleased = function () {
        return that.compileRelease(0);
    };

    that.version = function (version) {
        compileRelease.call(this, 0, parser.root.children, parser.createMDAST, version);

        return that.addDefinition(version, gitCompare);
    };

    that.insert = function (type, value) {
        const node = findHeaderOrCreate.call(this, type);
        node.children.push({
            text: value
        });
        that.compileUnreleased();
        return Promise.resolve();
    };

    that.addDefinition = function (version) {
        return addDefinition.call(that, version, gitCompare)
            .then(() => {
                return compileDefinitions.call(that, parser.root.children, parser.createMDAST);
            });
    };

    that.findRelease = function (version) {
        let node;
        for (let value of this.releases) {
            const release = REGEX_GET_VERSION.exec(value.text.toLowerCase().trim());
            if (release && release[1] && release[1] === version.toLowerCase().trim()) {
                node = value;
                break;
            }
        }
        return node;
    };

    that.TPL = TPL;

    return that;
}
