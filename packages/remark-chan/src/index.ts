import { removePosition } from 'unist-util-remove-position'
import { select } from 'unist-util-select'
import type { Node } from 'unist'
import {
  createRoot,
  createPreface,
  createRelease,
  createAction,
  createGroup,
  createChange,
  type ReleaseProps,
} from '@geut/chast'

interface MdastNode extends Node, Record<string, unknown> {
  children?: MdastNode[]
  depth?: number
  value?: string
  identifier?: string
  label?: string
  url?: string
  type: string
  changes?: MdastNode
}

export function remarkToChan(): (tree: Node) => Node {
  return (tree) => {
    const newTree = removePosition(tree, { force: true }) as unknown as MdastNode
    const preface = parsePreface(newTree)
    const releases = parseReleases(newTree)
    const nodes: Node[] = []
    if (preface) nodes.push(preface)
    nodes.push(...releases)
    return createRoot(nodes) as Node
  }
}

function parsePreface(tree: MdastNode): Node | null {
  const value = tree.children?.slice(0, 3) ?? []

  if (value.length !== 3) {
    return null
  }

  return createPreface(value as unknown as Record<string, unknown>[])
}

function parseReleases(tree: MdastNode): Node[] {
  const definitions =
    tree.children?.filter((node) => node.type === 'definition') ?? []

  const releases =
    tree.children?.filter(
      (node) =>
        ['heading', 'list'].includes(node.type) && node.depth !== 1
    ) ?? []

  const headingReleases = releases.filter(
    (node) => node.type === 'heading' && node.depth === 2
  )

  return headingReleases.map((node) => {
    const fromIdx = releases.indexOf(node)
    const nextNode = headingReleases[headingReleases.indexOf(node) + 1]
    const endIdx = nextNode ? releases.indexOf(nextNode) : undefined

    const actions = releases
      .slice(fromIdx + 1, endIdx)
      .reduce<MdastNode[]>((result, next) => {
        if (next.type === 'heading') {
          result.push(next)
          return result
        }

        result[result.length - 1]!.changes = next
        return result
      }, [])
      .filter((action) => action.changes)

    const props = parseHeadingRelease(node, definitions)
    return createRelease(
      props,
      actions.map((action) => parseAction(action))
    )
  })
}

function parseHeadingRelease(
  heading: MdastNode,
  definitions: MdastNode[]
): ReleaseProps {
  const link = select(':root > linkReference', heading) as MdastNode | null
  const text = select(':root > text', heading) as MdastNode | null

  let identifier = ''
  let version = ''
  let date: string | null = null
  let url: string | null = null
  let unreleased = false
  let yanked = false

  if (link) {
    unreleased = link.identifier === 'unreleased'
    yanked = link.identifier === 'yanked'

    identifier = link.identifier ?? ''
    version = link.label ?? ''

    const definition = definitions.find(
      (def) => def.identifier === link.identifier
    )
    url = definition ? (definition.url ?? null) : null

    date = text?.value?.trim().replace('- ', '').trim() ?? null
  } else if (text?.value) {
    const match = text.value.match(/\[(.*?)\]/)

    if (match) {
      const [, tag] = match
      if (tag === 'Unreleased') {
        identifier = 'unreleased'
        version = tag
        unreleased = true
      } else if (tag === 'YANKED') {
        const [first, rest] = text.value.trim().split(' - ')
        const [second] = rest?.split(' ') ?? []
        identifier = first ?? ''
        version = identifier
        date = second ?? null
        yanked = true
      }
    } else {
      const parts = text.value.trim().split(' - ')
      version = parts[0] ?? ''
      date = parts[1] ?? null
      identifier = version
    }
  }

  return {
    identifier,
    version,
    url,
    date,
    unreleased,
    yanked,
  }
}

function parseAction(action: MdastNode): Node {
  const changes = action.changes as MdastNode | undefined
  const children = action.children ?? []
  const name = (children[0] as MdastNode)?.value ?? ''

  return createAction(
    { name: name as never },
    changes ? parseChanges(changes.children ?? []) : []
  )
}

function parseChanges(changes: MdastNode[]): Node[] {
  return changes.map((change) => {
    const groupList = select(':root > list', change) as MdastNode | null
    if (groupList) {
      const nameNode = select(
        ':first-child > text',
        change
      ) as MdastNode | null
      return createGroup(
        { name: nameNode?.value ?? '' },
        groupList.children?.map((c) =>
          createChange((c as MdastNode).children ?? [])
        ) ?? []
      )
    }
    return createChange(change.children ?? [])
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
