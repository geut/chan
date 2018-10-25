import parser from '../parser';
import writer from '../cli/lib/writer';

const release = ({ version, cwd, parserInstance = parser(cwd), write = writer({ parserInstance }), group = false }) => {
    return parserInstance.release(version, { group })
        .then(write);
};

export default release;
