const { selectAll, select } = require('unist-util-select');
const unified = require('unified');
const u = require('unist-builder');
const markdown = require('remark-parse');
const remarkStringify = require('remark-stringify');
const removePosition = require('unist-util-remove-position');

const spaces = require('./spaces');

function stringify() {
  this.Compiler = compiler;

  const processor = unified()
    .use(markdown)
    .use(remarkStringify, {
      listItemIndent: '1'
    })
    .use(spaces);

  const parse = value =>
    removePosition(processor.parse(value), true).children[0];

  function compiler(tree) {
    return processor.stringify(
      u('root', [
        ...compilePreface({ tree, parse }),
        ...compileReleases({ tree, parse }),
        ...compileLinks({ tree, parse })
      ])
    );
  }
}

function compilePreface({ tree }) {
  const preface = select('preface', tree);

  if (!preface) {
    throw new Error('keep a changelog preface missing');
  }

  return preface.children;
}

function compileReleases({ tree, parse }) {
  const releases = selectAll('release', tree);
  return releases.reduce((result, release) => {
    const heading = parse(tplHeadingRelease(release));

    const actions = compileActions({
      actions: selectAll('action', release),
      parse
    });

    return [...result, heading, ...actions];
  }, []);
}

function tplHeadingRelease(release) {
  const date = release.unreleased ? '' : `- ${release.date}`;
  const version =
    release.yanked || !release.url ? release.version : `[${release.version}]`;
  const yanked = release.yanked ? '[YANKED]' : '';

  return `## ${version} ${date} ${yanked}`.trim();
}

function compileActions({ actions, parse }) {
  return actions.reduce((result, action) => {
    const heading = parse(`### ${action.name}`);
    const changes = compileChanges({
      changes: selectAll(':root > group,:root > change', action),
      parse
    });

    return [...result, heading, changes];
  }, []);
}

function compileChanges({ changes, parse }) {
  return parseList(
    changes.map(change => {
      if (change.type === 'group') {
        return parseListItem([
          parse(change.name),
          compileChanges({ changes: change.children, parse })
        ]);
      }

      return parseListItem(change.children);
    })
  );
}

function compileLinks({ tree, parse }) {
  const releases = selectAll('release', tree);
  return releases
    .filter(release => release.url)
    .map(release => parse(`[${release.version}]: ${release.url}`));
}

const parseList = value =>
  u(
    'list',
    { ordered: false, spread: false },
    Array.isArray(value) ? value : [value]
  );

const parseListItem = value =>
  u('listItem', { spread: false }, Array.isArray(value) ? value : [value]);

module.exports = stringify;
