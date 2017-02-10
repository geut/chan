import parser from '../parser';
import writer from '../cli/lib/writer';

const change = ({ type, msg, cwd, parserInstance = parser(cwd), write = writer({ parserInstance }) }) => {
    return parserInstance
        .change(parserInstance.SEPARATORS[type], msg)
        .then(write);
};

export default change;

export const TYPE = {
    ADDED : 'Added',
    CHANGED : 'Changed',
    FIXED : 'Fixed',
    SECURITY : 'Security',
    DEPRECATED : 'Deprecated',
    REMOVED : 'Removed'
};
