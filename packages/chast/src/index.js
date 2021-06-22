import assert from 'assert'
import { u } from 'unist-builder'
import semver from 'semver'

import { actions } from './actions.js'

const validValue = (value = []) => assert(Array.isArray(value), 'Value must be a valid array of unist elements.')

export const createRoot = (value = []) => {
  validValue(value)

  const nodes = value.filter(Boolean)
  const preface = nodes.find(n => n.type === 'preface')
  const releases = nodes.filter(n => n.type === 'release').sort(sortReleases)
  return u('root', [preface, ...releases].filter(Boolean))
}

export const createPreface = (value = []) => {
  validValue(value)

  return u('preface', value)
}

export const createRelease = (props, value = []) => {
  const { identifier, version, yanked, url } = props

  assert(identifier, 'The `identifier` of the release is required.')
  assert(version.toLowerCase() === 'unreleased' || !!semver.valid(version), 'The `version` prop to do a release is not valid.')
  validValue(value)

  // sanitize
  if (yanked && url) {
    // yanked versions can not have compare urls
    props.url = null
  }

  return u('release', props, value)
}

export const createAction = ({ name }, value = []) => {
  assert(Object.values(actions).includes(name), 'The `name` prop to create an action is not valid.')
  validValue(value)

  return u('action', { name }, value)
}

export const createGroup = ({ name }, value = []) => {
  assert(name, 'The `name` prop is required to create a group.')
  validValue(value)

  return u('group', { name }, value)
}

export const createChange = (value = []) => {
  validValue(value)

  return u('change', value)
}

function sortReleases (a, b) {
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
