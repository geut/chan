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
  constructor(info, extraMsg) {
    super(`CHANGELOG.md does not exists.${extraMsg}`, info);
  }
}

export class ChangelogNotExistsOnPathError extends ChangelogNotExistsError {
  constructor(info) {
    super(`CHANGELOG.md does not exists.`, ` Path: ${info.path}.`, info);
  }
}

export class VersionAlreadyExistsError extends ChanError {
  constructor(info) {
    super(`Version ${info.version} already exists on CHANGELOG.md.`, info);
  }
}

export class NoReaderProvidedError extends ChanError {
  constructor(info) {
    super(
      `If no path is provided, you must provide a Reader = { read(), exists() } for get CHANGELOG contents.`,
      info
    );
  }
}
