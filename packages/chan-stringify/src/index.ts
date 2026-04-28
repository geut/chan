import { selectAll, select } from 'unist-util-select'
import { u } from 'unist-builder'
import { toMarkdown } from 'mdast-util-to-markdown'
import type { Node } from 'unist'
import type { VFile } from 'vfile'
import type { Processor } from 'unified'
import type { Root } from 'mdast'

export interface StringifyOptions {
  withPreface?: boolean
}

// Custom chast node shapes — permissive enough for unist-util-select
interface ChastNode extends Node, Record<string, unknown> {
  children?: ChastNode[]
  name?: string
  version?: string
  date?: string
  unreleased?: boolean
  yanked?: boolean
  url?: string | null
  value?: string
  depth?: number
  label?: string
  referenceType?: string
  identifier?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringify(options: StringifyOptions = {}): void {
  const { withPreface = true } = options
  // @ts-expect-error: TS generates wrong types if `this` is typed regularly in exported functions.
  const self = this as Processor

  self.compiler = compiler

  function compiler(tree: Node, file: VFile): string {
    const root = u(
      'root',
      [
        ...(withPreface ? compilePreface(tree as ChastNode, file) : []),
        ...compileReleases(tree as ChastNode),
        ...compileLinks(tree as ChastNode),
      ]
    ) as unknown as Root

    return toMarkdown(root, {
      listItemIndent: 'one',
      bullet: '-',
      tightDefinitions: true,
      handlers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tag: (node: any) => (node.value as string) ?? '',
      } as Record<string, unknown>,
      join: [
        (left, right) => {
          if (
            left.type === 'heading' &&
            (right.type !== left.type || (right as { depth?: number }).depth! > 2)
          ) {
            return 0
          }
          if (left.type === 'list' && right.type === 'heading') return 1
          return undefined
        },
      ],
    })
  }
}

function compilePreface(tree: ChastNode, file: VFile): Node[] {
  const preface = select('preface', tree)

  if (!preface) {
    file.fail(new Error('Keep a changelog preface missing.'), tree, 'compilePreface')
    return []
  }

  return (preface as ChastNode).children ?? []
}

function compileReleases(tree: ChastNode): Node[] {
  const releases = selectAll('release', tree) as ChastNode[]
  return releases.reduce<Node[]>((result, release) => {
    const heading = compileHeadingRelease(release)
    const actions = compileActions(release)
    return [...result, heading, ...actions]
  }, [])
}

function compileHeadingRelease(release: ChastNode): Node {
  const children: Node[] = []

  if (release.url || release.unreleased) {
    children.push(
      u(
        'linkReference',
        { label: release.version!, referenceType: 'shortcut' },
        [u('text', release.version!)]
      )
    )
  } else {
    children.push(u('text', release.version!))
  }

  if (!release.unreleased) {
    children.push(u('text', ` - ${release.date}`))
  }

  if (release.yanked) {
    children.push(u('tag', ' [YANKED]') as unknown as Node)
  }

  return u('heading', { depth: 2 }, children)
}

function compileActions(release: ChastNode): Node[] {
  const actions = selectAll('action', release) as ChastNode[]
  return actions.reduce<Node[]>((result, action) => {
    const heading = u('heading', { depth: 3 }, [u('text', action.name!)])
    const changes = compileChanges(action)
    return [...result, heading, changes]
  }, [])
}

function compileChanges(action: ChastNode): Node {
  const changes = selectAll(':root > group,:root > change', action) as ChastNode[]
  const items = changes.map((change) => {
    if (change.type === 'group') {
      return compileListItem([
        u('text', change.name!),
        compileChanges(change),
      ])
    }

    return compileListItem(change.children ?? [])
  })
  return compileList(items)
}

function compileLinks(tree: ChastNode): Node[] {
  const releases = selectAll('release', tree) as ChastNode[]
  return releases
    .filter((release) => release.url)
    .map((release) =>
      u('definition', { identifier: release.version!, url: release.url })
    )
}

function compileList(value: Node[]): Node {
  return u('list', { ordered: false, spread: false }, value)
}

function compileListItem(value: Node[]): Node {
  return u('listItem', { spread: false }, value)
}
