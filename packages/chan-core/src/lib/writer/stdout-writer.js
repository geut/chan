const stdOutWriter = {
  write(contents) {
    process.stdout.write(contents);
    return contents;
  }
};

function createStdOutWriter() {
  return { ...stdOutWriter };
}

export default createStdOutWriter;
