import assert from 'node:assert'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { removePosition } from 'unist-util-remove-position'
import { select, selectAll } from 'unist-util-select'
import semver from 'semver'
import type { Node } from 'unist'
import type { VFile } from 'vfile'

import {
  createRoot,
  createPreface,
  createRelease,
  createAction,
  createGroup,
  createChange,
} from '@geut/chast'

import { template as tplPreface } from './templates/preface.js'

interface ChastNode extends Node {
  [key: string]: unknown
  children?: ChastNode[]
  identifier?: string
  version?: string
  name?: string
  unreleased?: boolean
  url?: string | null
}

const mdProcessor = unified().use(remarkParse)

const parse = (value: string): Node[] => {
  const tree = mdProcessor.parse(value)
  return ((removePosition(tree, true) as unknown) as { children?: Node[] }).children ?? []
}

export interface InitializeOptions {
  overwrite?: boolean
}

export function initialize({ overwrite = false }: InitializeOptions = {}) {
  return function compile(tree: Node, file: VFile): Node {
    const preface = select('preface', tree as ChastNode)

    if (preface && !overwrite) {
      file.fail('The changelog already exists.', preface as unknown as Node, 'addPreface')
    }

    return createRoot([
      createPreface(parse(tplPreface)),
      createRelease({
        identifier: 'unreleased',
        version: 'Unreleased',
        yanked: false,
        unreleased: true,
      }),
    ])
  }
}

export interface ChangeItem {
  version?: string
  action: string
  group?: string
  value: string
}

export interface AddChangesOptions {
  changes: ChangeItem[]
}

export function addChanges({ changes }: AddChangesOptions) {
  assert(Array.isArray(changes), 'The `changes` prop must be an array to add changes.')

  function compile(tree: Node, file: VFile): Node {
    return changes.reduce<Node>((result, { version = 'unreleased', action, group, value }) => {
      assert(value, '`value` is required')

      const release = select(`release[identifier=${version}]`, result as ChastNode)

      if (!release) {
        file.message(`The release "${version}" was not found.`, result as ChastNode, 'addChanges')
        return result
      }

      const actionNode = findActionOrCreate(action, release as ChastNode)
      const changeNode = createChange(parse(value)) as ChastNode

      if (group) {
        const groupNode = findGroupOrCreate(group, actionNode)
        ;(groupNode as ChastNode).children = [...((groupNode as ChastNode).children ?? []), changeNode]
      } else {
        ;(actionNode as ChastNode).children = [...((actionNode as ChastNode).children ?? []), changeNode]
      }

      return result
    }, tree)
  }

  return compile
}

export interface AddReleaseOptions {
  version: string
  date?: string
  yanked?: boolean
  gitCompareTemplate?: string
  gitReleaseTemplate?: string
  gitBranch?: string
  allowYanked?: boolean
  allowPrerelease?: boolean
  mergePrerelease?: boolean
  releasePrefix?: string
}

export function addRelease({
  version: userVersion,
  date = now(),
  yanked = false,
  gitCompareTemplate,
  gitReleaseTemplate,
  gitBranch,
  allowYanked,
  allowPrerelease,
  mergePrerelease,
  releasePrefix = 'v',
}: AddReleaseOptions) {
  function compile(tree: Node, file: VFile): Node | undefined {
    const preface = select('preface', tree as ChastNode)
    const unreleased = select('release[identifier=unreleased]', tree as ChastNode)
    let releases = (selectAll('release', tree as ChastNode) as ChastNode[]).filter((r) => !r.unreleased)
    const version = semver.valid(userVersion)
    const prereleases = releases.filter(
      (r) => {
        const rVersion = semver.valid(semver.coerce(r.version!))
        return !!semver.prerelease(r.version!) && rVersion && semver.eq(rVersion, version!)
      }
    )
    let isYanked = yanked

    if (!version) {
      file.fail('Version release is not valid.')
    }

    const isPrerelease = !!semver.prerelease(version)
    const toMergePrereleases = !isPrerelease && mergePrerelease && prereleases.length > 0

    if (!unreleased) {
      file.fail('Missing unreleased header.', undefined, 'release:missing-unreleased')
    }

    if (isPrerelease && !allowPrerelease && !mergePrerelease) {
      file.message('Ignoring release.', undefined, 'release:ignoring-prerelease')
      return tree
    }

    const unreleasedNode = unreleased as ChastNode

    if (!toMergePrereleases && !isYanked && (unreleasedNode.children?.length ?? 0) === 0) {
      if (!allowYanked) {
        file.info('There are not new changes to release.', undefined, 'release:no-changes')
        file.data.aborted = true
        return undefined as unknown as Node
      }

      file.info(
        'There are not new changes to release. Detecting yanked release.',
        undefined,
        'release:allow-yanked'
      )
      isYanked = true
    }

    if (select(`release[identifier=${version}]`, tree as ChastNode)) {
      file.fail(`The release ${version} already exists.`)
    }

    let changes: Node[]
    if (isYanked) {
      changes = []
    } else {
      changes = unreleasedNode.children ?? []
      unreleasedNode.children = []
    }

    if (toMergePrereleases) {
      releases = releases.filter(
        (r) => !prereleases.find((pr) => pr.identifier === r.identifier)
      )
      const prereleaseChanges = prereleases.reduce<Node[]>(
        (prev, current) => mergeActionChanges([...prev, ...(current.children ?? [])]),
        []
      )
      changes = mergeActionChanges([...changes, ...prereleaseChanges])
    }

    let releaseUrl: string | undefined
    if (gitCompareTemplate && gitBranch) {
      const [lastRelease] = releases

      if (lastRelease) {
        releaseUrl = gitCompareTemplate
          .replace('[prev]', `${releasePrefix}${lastRelease.version}`)
          .replace('[next]', `${releasePrefix}${version}`)
      } else {
        releaseUrl = gitReleaseTemplate?.replace('[next]', `${releasePrefix}${version}`)
      }

      unreleasedNode.url = gitCompareTemplate
        .replace('[prev]', `${releasePrefix}${version}`)
        .replace('[next]', gitBranch)
    }

    const newRelease = createRelease(
      {
        identifier: version.toLowerCase(),
        version,
        url: releaseUrl ?? null,
        yanked: isYanked,
        date,
      },
      changes
    )

    const treeNode = tree as ChastNode
    treeNode.children = [preface, unreleased, newRelease, ...releases].filter(
      Boolean
    ) as ChastNode[]
    return tree
  }

  return compile
}

function findActionOrCreate(action: string, release: ChastNode): ChastNode {
  let name = action.toLowerCase().trim()
  name = name[0]!.toUpperCase() + name.slice(1)

  let actionNode = select(`action[name=${name}]`, release) as ChastNode | null

  if (actionNode) {
    return actionNode
  }

  actionNode = createAction({ name: name as never }) as ChastNode
  release.children = [...(release.children ?? []), actionNode]
  return actionNode
}

function findGroupOrCreate(group: string, action: ChastNode): ChastNode {
  let groupNode = select(`group[name=${group}]`, action) as ChastNode | null

  if (groupNode) {
    return groupNode
  }

  groupNode = createGroup({ name: group }) as ChastNode
  action.children = [...(action.children ?? []), groupNode]
  return groupNode
}

function now(): string {
  const date = new Date()
  return [
    String(date.getFullYear()),
    '-',
    (`0${date.getMonth() + 1}`).slice(-2),
    '-',
    (`0${date.getDate()}`).slice(-2),
  ].join('')
}

function mergeActionChanges(actions: Node[]): Node[] {
  return actions.reduce<Node[]>((result, action) => {
    const currentAction = result.find(
      (a) => (a as ChastNode).name === (action as ChastNode).name
    )

    if (!currentAction) {
      return [...result, action]
    }

    ;(currentAction as ChastNode).children = mergeChanges([
      ...((currentAction as ChastNode).children ?? []),
      ...((action as ChastNode).children ?? []),
    ]) as ChastNode[]
    return result
  }, [])
}

function mergeChanges(changes: Node[]): Node[] {
  return changes.reduce<Node[]>((result, change) => {
    if (change.type === 'change') {
      return [...result, change]
    }

    const groupIdx = result.findIndex(
      (c) => c.type === 'group' && (c as ChastNode).name === (change as ChastNode).name
    )
    if (groupIdx === -1) {
      return [...result, change]
    }

    const target = result[groupIdx] as ChastNode
    target.children = [
      ...(target.children ?? []),
      ...((change as ChastNode).children ?? []),
    ]
    return result
  }, [])
}
