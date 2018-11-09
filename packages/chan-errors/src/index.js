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

export class ChangelogAlreadyExistsError extends ChanError {
  constructor(info) {
    super(`A CHANGELOG.md already exists on ${info.path}/CHANGELOG.md.`, info);
  }
}

export class ChangelogNotExistsError extends ChanError {
  constructor(info) {
    super(`CHANGELOG.md does not exists. Path: ${info.path}.`, info);
  }
}

export class VersionAlreadyExistsError extends ChanError {
  constructor(info) {
    super(`Version ${info.version} already exists on CHANGELOG.md.`, info);
  }
}
