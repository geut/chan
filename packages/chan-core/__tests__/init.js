import path from 'path';
import createFsReader from '../src/lib/reader/fs-reader';
import createFsWriter from '../src/lib/writer/fs-writer';
import createStdOutWriter from '../src/lib/writer/stdout-writer';
import init from '../src/api/init';
import { ChangelogAlreadyExistsError } from '@geut/chan-errors';

const existentChangelogPath = path.join(__dirname, 'fixtures', 'initialized');

jest.mock('../src/lib/reader/fs-reader');
jest.mock('../src/lib/writer/fs-writer');
jest.mock('../src/lib/writer/stdout-writer');

const FsWriter_write = jest.fn();
const StdOutWriter_write = jest.fn();
const FsReader_exists = jest.fn();

beforeAll(() => {
  createFsWriter.mockImplementation(() => {
    return {
      write: FsWriter_write
    };
  });

  createStdOutWriter.mockImplementation(() => {
    return {
      write: StdOutWriter_write
    };
  });
});

beforeEach(() => {
  createFsReader.mockClear();
  createFsWriter.mockClear();
  createStdOutWriter.mockClear();
  FsReader_exists.mockClear();
  FsWriter_write.mockClear();
  StdOutWriter_write.mockClear();
});

describe('CHANGELOG initialization (output: file system)', () => {
  test('Overrides existent CHANGELOG.md', () => {
    init(true, {
      path: existentChangelogPath
    });

    expect(createFsReader).toHaveBeenCalledTimes(1);
    expect(createFsWriter).toHaveBeenCalledTimes(1);
    expect(FsWriter_write).toHaveBeenCalled();
  });

  test("Don't overrides existent CHANGELOG.md", () => {
    createFsReader.mockImplementation(() => {
      return {
        exists: FsReader_exists
      };
    });

    FsReader_exists.mockReturnValueOnce(true);

    try {
      init(false, {
        path: existentChangelogPath
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ChangelogAlreadyExistsError);
    }

    expect(createFsReader).toHaveBeenCalledTimes(1);
    expect(FsReader_exists).toHaveBeenCalled();
    expect(createFsWriter).not.toHaveBeenCalled();
  });
});

describe('CHANGELOG initialization (output: stdout)', () => {
  test('Overrides existent CHANGELOG.md', () => {
    init(true, {
      stdout: true,
      path: existentChangelogPath
    });

    expect(createFsReader).toHaveBeenCalledTimes(1);
    expect(createStdOutWriter).toHaveBeenCalledTimes(1);
    expect(StdOutWriter_write).toHaveBeenCalled();
  });

  test("Don't overrides existent CHANGELOG.md", () => {
    createFsReader.mockImplementation(() => {
      return {
        exists: FsReader_exists
      };
    });

    FsReader_exists.mockReturnValueOnce(true);

    try {
      init(false, {
        path: existentChangelogPath,
        stdout: true
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ChangelogAlreadyExistsError);
    }

    expect(createFsReader).toHaveBeenCalledTimes(1);
    expect(FsReader_exists).toHaveBeenCalled();
    expect(createStdOutWriter).not.toHaveBeenCalled();
  });
});
