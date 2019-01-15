const assert = require('assert');
const u = require('unist-builder');
const semver = require('semver');

const actions = require('./actions');

const validValue = (value = []) => assert(Array.isArray(value), 'Value must be a valid array of unist elements.');

exports.createRoot = (value = []) => {
  validValue(value);

  const nodes = value.filter(Boolean);
  const preface = nodes.find(n => n.type === 'preface');
  const releases = nodes.filter(n => n.type === 'release').sort(sortReleases);
  return u('root', [preface, ...releases].filter(Boolean));
};

exports.createPreface = (value = []) => {
  validValue(value);

  return u('preface', value);
};

exports.createRelease = (props, value = []) => {
  const { identifier, version, yanked, url } = props;

  assert(identifier, 'The `identifier` of the release is required.');
  assert(version === 'Unreleased' || semver.valid(version), 'The `version` prop to do a release is not valid.');
  validValue(value);

  // sanitize
  if (yanked && url) {
    // yanked versions can not have compare urls
    props.url = null;
  }

  return u('release', props, value);
};

exports.createAction = ({ name }, value = []) => {
  assert(Object.values(actions).includes(name), 'The `name` prop to create an action is not valid.');
  validValue(value);

  return u('action', { name }, value);
};

exports.createGroup = ({ name }, value = []) => {
  assert(name, 'The `name` prop is required to create a group.');
  validValue(value);

  return u('group', { name }, value);
};

exports.createChange = (value = []) => {
  validValue(value);

  return u('change', value);
};

function sortReleases(a, b) {
  if (a.version === 'Unreleased') {
    return 0;
  }

  if (semver.lt(a.version, b.version)) {
    return 1;
  }

  return -1;
}
