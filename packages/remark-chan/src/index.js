import { removePosition } from 'unist-util-remove-position'
import { select } from 'unist-util-select'
import { createRoot, createPreface, createRelease, createAction, createGroup, createChange } from '@geut/chast'

export function remarkToChan () {
  return tree => {
    const newTree = removePosition(tree, true)
    return createRoot([parsePreface(newTree), ...parseReleases(newTree)])
  }
}

function parsePreface (tree) {
  const value = tree.children.slice(0, 3)

  if (value.length !== 3) {
    return null
  }

  return createPreface(tree.children.slice(0, 3))
}

function parseReleases (tree) {
  const definitions = tree.children.filter(node => node.type === 'definition')

  const releases = tree.children.filter(node => ['heading', 'list'].includes(node.type) && node.depth !== 1)

  const headingReleases = releases.filter(node => node.type === 'heading' && node.depth === 2)

  return headingReleases.map(node => {
    const fromIdx = releases.indexOf(node)
    const nextNode = headingReleases[headingReleases.indexOf(node) + 1]
    const endIdx = nextNode ? releases.indexOf(nextNode) : undefined

    // the changes on the keepachangelog are next to the action group as a list type
    const actions = releases
      .slice(fromIdx + 1, endIdx)
      .reduce((result, next) => {
        if (next.type === 'heading') {
          result.push(next)
          return result
        }

        result[result.length - 1].changes = next
        return result
      }, [])
      .filter(action => action.changes)

    const props = parseHeadingRelease(node, definitions)
    return createRelease(props, actions.map(action => parseAction(action)))
  })
}

function parseHeadingRelease (heading, definitions) {
  const link = select(':root > linkReference', heading)
  const text = select(':root > text', heading)

  let identifier, version, date, url
  let unreleased = false
  let yanked = false

  if (link) {
    // In previous versions of remark [unreleased] and [YANKED] were treated as linkReference elements.
    unreleased = !!(link && link.identifier === 'unreleased')
    yanked = !!(link && link.identifier === 'yanked')

    identifier = link.identifier
    version = link.label

    const definition = definitions.find(def => def.identifier === link.identifier)
    url = definition ? definition.url : null

    date = text ? text.value.trim().replace('- ', '').trim() : null
  } else {
    const match = text.value.match(/\[(.*?)\]/)

    if (match) {
      const tag = match[1]
      if (tag === 'Unreleased') {
        identifier = 'unreleased'
        version = tag
        unreleased = true
      }
      if (tag === 'YANKED') {
        const [first, rest] = text.value.trim().split(' - ')
        const [second] = rest.split(' ')
        identifier = first
        version = identifier
        date = second
        yanked = true
      }
    } else {
      // first release: 0.0.1 - 2014-05-31
      ([version, date] = text.value.trim().split(' - '))
      identifier = version
    }
  }

  return {
    identifier,
    version,
    url,
    date,
    unreleased,
    yanked
  }
}

function parseAction (action) {
  const { changes, children } = action
  const name = children[0].value

  return createAction({ name }, changes && parseChanges(changes.children))
}

function parseChanges (changes) {
  return changes.map(change => {
    const groupList = select(':root > list', change)
    if (groupList) {
      const name = select(':first-child > text', change).value
      return createGroup({ name }, groupList.children.map(change => createChange(change.children)))
    }
    return createChange(change.children)
  })
}

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
