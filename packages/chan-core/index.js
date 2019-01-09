const unified = require('unified');
const markdown = require('remark-parse');
const { selectAll } = require('unist-util-select');

const remarkToChan = require('@geut/remark-chan');
const stringify = require('@geut/chan-stringify');

const {
  initialize: transformerInitialize,
  addChanges: transformerAddChanges,
  addRelease: transformerAddRelease
} = require('./transformer');

const preset = (plugin, opts = {}) => [
  [markdown, remarkToChan, [plugin, opts], stringify],
  { settings: { position: false } }
];

exports.initialize = function initialize(from, opts, cb) {
  return unified()
    .use(...preset(transformerInitialize, opts))
    .process(from, cb);
};

exports.addChanges = function addChanges(from, opts, cb) {
  return unified()
    .use(...preset(transformerAddChanges, opts))
    .process(from, cb);
};

exports.addRelease = function addRelease(from, opts, cb) {
  return unified()
    .use(...preset(transformerAddRelease, opts))
    .process(from, cb);
};

exports.getLastVersionRelease = function getLastRelease(from) {
  const tree = remarkToChan()(
    unified()
      .use(markdown)
      .parse(from)
  );

  const release = selectAll('release', tree).filter(r => !r.unreleased)[0];

  if (release) {
    return release.version;
  }

  return null;
};
