class Writer {
  constructor(parser) {
    this.parser = parser;
  }

  get data() {
    return this.parser.stringify();
  }
}

export class FsWriter extends Writer {
  async write() {
    await this.parser.write(this.data);
    return this.data;
  }
}

export class StdOutWriter extends Writer {
  write() {
    process.stdout.write(this.data);
    return this.data;
  }
}

const buildWritter = (parser, stdout = false) => {
  const WriterClass = stdout ? StdOutWriter : FsWriter;

  return new WriterClass(parser);
};

export default buildWritter;
