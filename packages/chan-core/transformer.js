const assert = require('assert');
const unified = require('unified');
const markdown = require('remark-parse');
const removePosition = require('unist-util-remove-position');
const { select } = require('unist-util-select');
const { createPreface, createRelease, createAction, createGroup, createChange } = require('@geut/chast');
const tplPreface = require('./templates/preface');

const processor = unified().use(markdown);

const parse = value => removePosition(processor.parse(value), true).children;

exports.initialize = function initialize({ overwrite = false } = {}) {
  function compile(tree, file) {
    const preface = select('preface', tree);

    if (preface && !overwrite) {
      file.fail(new Error('The changelog already exists.'), preface, 'addPreface');
    }

    tree.children = [
      createPreface(parse(tplPreface)),
      createRelease({
        identifier: 'unreleased',
        version: 'Unreleased',
        unreleased: true
      })
    ];

    return tree;
  }

  return compile;
};

exports.addChanges = function addChanges({ changes }) {
  assert(Array.isArray(changes), 'The `changes` prop must be an array to add changes.');

  function compile(tree, file) {
    return changes.reduce((result, { version = 'unreleased', action, group, value }) => {
      assert(value, '`value` is required');

      const release = select(`release[identifier=${version}]`, tree);

      if (!release) {
        file.message(`The release "${version}" was not found.`, tree, 'addChanges');
        return tree;
      }

      const actionNode = findActionOrCreate(action, release);
      const changeNode = createChange(parse(value));

      if (group) {
        const groupNode = findGroupOrCreate(group, actionNode);
        groupNode.children.push(changeNode);
      } else {
        actionNode.children.push(changeNode);
      }

      return tree;
    }, tree);
  }

  return compile;
};

exports.addRelease = function addRelease({ version, url, date = now(), yanked = false }) {
  function compile(tree, file) {
    const { children } = tree;
    const unreleased = select('release[identifier=unreleased]', tree);
    const unreleasedIdx = children.indexOf(unreleased);

    if (!unreleased || unreleased.children.length === 0) {
      file.fail(new Error('There are not new changes to release.'));
    }

    if (select(`release[identifier=${version}]`, tree)) {
      file.fail(new Error(`The release ${version} already exists.`));
    }

    const newRelease = createRelease(
      {
        identifier: version.toLowerCase(),
        version,
        url,
        yanked,
        date
      },
      unreleased.children
    );

    unreleased.children = [];

    tree.children = [...children.slice(0, unreleasedIdx + 1), newRelease, ...children.slice(unreleasedIdx + 1)];
    return tree;
  }

  return compile;
};

function findActionOrCreate(action, release) {
  let name = action.toLowerCase().trim();
  name = name[0].toUpperCase() + name.substr(1);

  let actionNode = select(`action[name=${name}]`, release);

  if (actionNode) {
    return actionNode;
  }

  actionNode = createAction({ name });
  release.children.push(actionNode);
  return actionNode;
}

function findGroupOrCreate(group, action) {
  let groupNode = select(`group[name=${group}]`, action);

  if (groupNode) {
    return groupNode;
  }

  groupNode = createGroup({ name: group });
  action.children.push(groupNode);
  return groupNode;
}

function now() {
  const date = new Date();
  return [date.getFullYear(), '-', ('0' + (date.getMonth() + 1)).slice(-2), '-', ('0' + date.getDate()).slice(-2)].join(
    ''
  );
}
