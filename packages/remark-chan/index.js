const removePosition = require('unist-util-remove-position');
const { select } = require('unist-util-select');
const { createRoot, createPreface, createRelease, createAction, createGroup, createChange } = require('@geut/chast');

function remarkToChan() {
  return tree => {
    const newTree = removePosition(tree, true);
    return createRoot([parsePreface(newTree), ...parseReleases(newTree)].filter(Boolean));
  };
}

function parsePreface(tree) {
  const value = tree.children.slice(0, 3);

  if (value.length !== 3) {
    return null;
  }

  return createPreface(tree.children.slice(0, 3));
}

function parseReleases(tree) {
  const definitions = tree.children.filter(node => node.type === 'definition');

  const releases = tree.children.filter(node => ['heading', 'list'].includes(node.type) && node.depth !== 1);

  const headingReleases = releases.filter(node => node.type === 'heading' && node.depth === 2);

  return headingReleases.map(node => {
    const fromIdx = releases.indexOf(node);
    const nextNode = headingReleases[headingReleases.indexOf(node) + 1];
    const endIdx = nextNode ? releases.indexOf(nextNode) : undefined;

    // the changes on the keepachangelog are next to the action group as a list type
    const actions = releases
      .slice(fromIdx + 1, endIdx)
      .reduce((result, next) => {
        if (next.type === 'heading') {
          result.push(next);
          return result;
        }

        result[result.length - 1].changes = next;
        return result;
      }, [])
      .filter(action => action.changes);

    const props = parseHeadingRelease(node, definitions);

    return createRelease(props, actions.map(action => parseAction(action)));
  });
}

function parseHeadingRelease(heading, definitions) {
  let link = select(':root > linkReference', heading);
  let text = select(':root > text', heading);
  let unreleased = link && link.identifier === 'unreleased' ? true : null;

  if (!link) {
    // first release
    const [version, date] = text.value.split(' - ');
    return {
      identifier: version,
      version,
      date
    };
  }

  if (link.identifier === 'yanked') {
    const [version, date] = text.value.trim().split(' - ');
    return {
      identifier: version,
      version,
      date,
      yanked: true
    };
  }

  const definition = definitions.find(def => def.identifier === link.identifier);

  return {
    identifier: link.identifier,
    version: link.label,
    url: definition ? definition.url : null,
    date: unreleased
      ? null
      : text.value
          .trim()
          .replace('- ', '')
          .trim(),
    unreleased
  };
}

function parseAction(action) {
  const { changes, children } = action;
  const name = children[0].value;

  return createAction({ name }, changes && parseChanges(changes.children));
}

function parseChanges(changes) {
  return changes.map(change => {
    const groupList = select(':root > list', change);
    if (groupList) {
      const name = select(':first-child > text', change).value;
      return createGroup({ name }, groupList.children.map(change => createChange(change.children)));
    }
    return createChange(change.children);
  });
}

module.exports = remarkToChan;

/**
 * root {
 *   preface {}
 *   release [version, date, link?] {
 *     action [name=(ADDED, CHANGED, REMOVED)] {
 *        group {
 *          change {
 *
 *          }
 *        }
 *        change {
 *
 *        }
 *     }
 *   }
 * }
 **/
