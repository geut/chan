import { selectAll, select } from 'unist-util-select'
import u from 'unist-builder'
import toMarkdown from 'mdast-util-to-markdown'

export function stringify({ withPreface = true } = {}) {
  this.Compiler = compiler

  function compiler(tree, file) {
    return toMarkdown(
      u('root', [
        ...(withPreface ? compilePreface({ tree, file }) : []),
        ...compileReleases({ tree, file }),
        ...compileLinks({ tree, file })
      ]),
      {
        listItemIndent: 'one',
        bullet: '-',
        tightDefinitions: true,
        handlers: {
          'tag': (node) => node.value
        },
        join: (left, right, parent, context) => {
          if (left.type === 'heading' && (right.type !== left.type || right.depth > 2) ) {
            return 0
          }
          if (left.type === 'list' && right.type === 'heading') return 1
        }
      }
    )
  }
}

function compilePreface({ tree, file }) {
  const preface = select('preface', tree)

  if (!preface) {
    file.fail(new Error('Keep a changelog preface missing.'), tree, 'compilePreface')
  }

  return preface.children
}

function compileReleases({ tree }) {
  const releases = selectAll('release', tree)
  return releases.reduce((result, release) => {
    const heading = compileHeadingRelease(release)

    const actions = compileActions({
      actions: selectAll('action', release),
    })

    return [...result, heading, ...actions]
  }, [])
}

function compileHeadingRelease(release) {
  const date = release.unreleased ? '' : u('text', ` - ${release.date}`)
  const yanked = release.yanked ? u('tag' ,' [YANKED]') : ''
  let version

  if (release.url || release.unreleased) {
    version = u('linkReference', { label: release.version, referenceType: 'shortcut' }, [u('text', release.version)])
  } else {
    version = u('text', release.version)
  }

  return u('heading', { depth: 2 }, [
    version,
    date,
    yanked
  ].filter(Boolean))

}

function compileActions({ actions }) {
  return actions.reduce((result, action) => {
    const heading = u('heading', { depth: 3 }, [ u('text', action.name) ])
    const changes = compileChanges({
      changes: selectAll(':root > group,:root > change', action)
    })

    return [...result, heading, changes]
  }, [])
}

function compileChanges({ changes }) {
  return compileList(
    changes.map(change => {
      if (change.type === 'group') {
        return compileListItem([u('text', change.name), compileChanges({ changes: change.children })])
      }

      return compileListItem(change.children)
    })
  )
}

function compileLinks({ tree, parse }) {
  const releases = selectAll('release', tree)
  return releases.filter(release => release.url).map(release => u('definition', { identifier: release.version, url: release.url  }))
}

const compileList = value => u('list', { ordered: false, spread: false }, Array.isArray(value) ? value : [value])

const compileListItem = value => u('listItem', { spread: false }, Array.isArray(value) ? value : [value])
