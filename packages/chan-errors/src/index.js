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
    super(
      `A CHANGELOG.md already exists on ${info.folder}/CHANGELOG.md.`,
      info
    );
  }
}

export class ChangelogNotExistsError extends ChanError {
  constructor(info) {
    super(`CHANGELOG.md does not exists. Path: ${info.folder}.`, info);
  }
}
