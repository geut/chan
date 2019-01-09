const assert = require('assert');
const u = require('unist-builder');
const semver = require('semver');

const actions = require('./actions');

const validValue = (value = []) => assert(Array.isArray(value), 'Value must be a valid array of unist elements.');

exports.createRoot = (value = []) => {
  validValue(value);

  return u('root', value);
};

exports.createPreface = (value = []) => {
  validValue(value);

  return u('preface', value);
};

exports.createRelease = (props, value = []) => {
  assert(props.identifier, '`identifier` is required');
  assert(props.version === 'Unreleased' || semver.valid(props.version), '`version` is not valid');
  validValue(value);

  return u('release', props, value);
};

exports.createAction = ({ name }, value = []) => {
  assert(Object.values(actions).includes(name), 'the `name` for the action is not valid.');
  validValue(value);

  return u('action', { name }, value);
};

exports.createGroup = ({ name }, value = []) => {
  assert(name, '`name` is required');
  validValue(value);

  return u('group', { name }, value);
};

exports.createChange = (value = []) => {
  validValue(value);

  return u('change', value);
};
