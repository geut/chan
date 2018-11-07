const writer = ({ parserInstance, stdout = false }) => async () => {
  const data = parserInstance.stringify();
  // write callback function
  if (stdout) {
    process.stdout.write(data);
  } else {
    await parserInstance.write(data);
  }

  return data;
};

export default writer;
