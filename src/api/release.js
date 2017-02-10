import parser from '../parser';
import writer from '../cli/lib/writer';

const release = ({ version, cwd, parserInstance = parser(cwd), write = writer({ parserInstance }) }) => {
    return parserInstance.release(version)
        .then(write);
};

export default release;
