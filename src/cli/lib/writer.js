
const writer = ({ parserInstance, stdout = false }) => () => {

    return new Promise((resolve) => {
        const data = parserInstance.stringify();
        // write callback function
        if (stdout) {
            process.stdout.write(data);
        } else {
            parserInstance.write(data);
        }
        resolve(data);
    });

};

export default writer;
