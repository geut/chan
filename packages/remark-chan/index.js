const removePosition = require('unist-util-remove-position');
const u = require('unist-builder');
const { select } = require('unist-util-select');

function remarkToChan() {
  return tree => {
    tree = removePosition(tree, true);
    return u('root', [parsePreface(tree), ...parseReleases(tree)]);
  };
}

function parsePreface(tree) {
  return u('preface', tree.children.slice(0, 3));
}

function parseReleases(tree) {
  const definitions = tree.children.filter(node => node.type === 'definition');

  const releases = tree.children.filter(
    node => ['heading', 'list'].includes(node.type) && node.depth !== 1
  );

  const headingReleases = releases.filter(
    node => node.type === 'heading' && node.depth === 2
  );

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

    return u('release', props, actions.map(action => parseAction(action)));
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
      version,
      date
    };
  }

  if (link.identifier === 'yanked') {
    const [version, date] = text.value.trim().split(' - ');
    return {
      version,
      date,
      yanked: true
    };
  }

  const definition = definitions.find(
    def => def.identifier === link.identifier
  );

  return {
    identifier: link.identifier,
    version: link.label,
    url: definition.url,
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

  return u('action', { name }, changes && parseChanges(changes.children));
}

function parseChanges(changes) {
  return changes.map(change => {
    const groupList = select(':root > list', change);
    if (groupList) {
      const name = select(':first-child > text', change).value;
      return u(
        'group',
        { name },
        groupList.children.map(change => u('change', change.children))
      );
    }
    return u('change', change.children);
  });
}

module.exports = remarkToChan;

/**
 * root {
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
