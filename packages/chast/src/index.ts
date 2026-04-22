import assert from 'node:assert'
import { u } from 'unist-builder'
import type { Node } from 'unist'
import semver from 'semver'

import { actions, type Actions } from './actions.js'

const validValue = (value: (Record<string, unknown> | ReleaseNode)[] = []) =>
  assert(Array.isArray(value), 'Value must be a valid array odf unist elements.')

export type ReleaseNode = Node & {
  type: 'release'
  version: string
}

export type PrefaceNode = Node & {
  type: 'preface'
  children: Node[]
}

export interface PrefaceNodeInput {
  type: string
  value: string
}

export interface ReleaseProps {
  identifier: string
  version: string
  yanked: boolean
  url?: string | null
}

export const createRoot = (value: (Record<string, unknown> | ReleaseNode)[] = []) => {
  validValue(value)

  const nodes = value.filter(Boolean) as (PrefaceNode | ReleaseNode)[]
  const preface = nodes.find(n => n.type === 'preface') as PrefaceNode | undefined
  const releases = nodes.filter(n => n.type === 'release').toSorted(sortReleases)
  return u('root', [preface, ...releases].filter(Boolean) as PrefaceNode[] | ReleaseNode[])
}

export const createPreface = (value: Record<string, unknown>[] = []): Node => {
  validValue(value)
  return u('preface', value as unknown as Record<string, unknown>) as Node
}

export const createRelease = (props: ReleaseProps, value = []) => {
  const { identifier, version, yanked, url } = props

  assert(identifier, 'The `identifier` of the release is required.')
  assert(
    version.toLowerCase() === 'unreleased' || !!semver.valid(version),
    'The `version` prop to do a release is not valid.'
  )
  validValue(value)

  // sanitize
  if (yanked && url) {
    // yanked versions can not have compare urls
    props.url = null
  }

  return u('release', { ...props, url: props.url ?? null }, value)
}

export const createAction = ({ name }: { name: Actions[keyof Actions] }, value = []) => {
  assert(Object.values(actions).includes(name), 'The `name` prop to create an action is not valid.')
  validValue(value)

  return u('action', { name }, value)
}

export const createGroup = ({ name }: { name: keyof Actions }, value = []) => {
  assert(name, 'The `name` prop is required to create a group.')
  validValue(value)

  return u('group', { name }, value)
}

export const createChange = (value = []) => {
  validValue(value)

  return u('change', value)
}

function sortReleases(a: ReleaseNode, b: ReleaseNode): number {
  if (a.version === 'Unreleased') {
    return -1
  }

  if (b.version === 'Unreleased') {
    return 1
  }

  if (semver.lt(a.version, b.version)) {
    return 1
  }

  return -1
}