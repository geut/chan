'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var parser = _interopDefault(require('@chan/chan-parser'));
var chanErrors = require('@chan/chan-errors');

const writer = ({
  parserInstance,
  stdout = false
}) => async () => {
  const data = parserInstance.stringify(); // write callback function

  if (stdout) {
    process.stdout.write(data);
  } else {
    await parserInstance.write(data);
  }

  return data;
};

const template = `
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;

const init = async ({
  overwrite = false,
  folder = process.cwd()
}) => {
  const parserInstance = parser(folder);

  if (parserInstance.exists() && !overwrite) {
    throw new chanErrors.ChangelogAlreadyExistsError({
      folder
    });
  }

  const m = parserInstance.createMDAST;
  const write = writer({
    parserInstance
  });
  parserInstance.root.children = m(template);
  write();
};

// export default {

exports.init = init;
