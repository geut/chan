'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class ChanError extends Error {
  constructor(message = '', info = {}) {
    super(message);
    this.info = info;
    this.stack = new Error().stack;
  }

  is(otherErrorClass) {
    return this instanceof otherErrorClass;
  }

}

class ChangelogAlreadyExistsError extends ChanError {
  constructor(info) {
    super(`A CHANGELOG.md already exists on ${info.folder}/CHANGELOG.md.`, info);
  }

}

exports.ChangelogAlreadyExistsError = ChangelogAlreadyExistsError;