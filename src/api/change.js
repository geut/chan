import parser from '../parser';
import writer from '../cli/lib/writer';

const change = ({ type, msg, cwd, parserInstance = parser(cwd), write = writer({ parserInstance }), group }) => {
    return parserInstance
        .change(parserInstance.SEPARATORS[type], msg, { group })
        .then(write);
};

export default change;

export const TYPE = {
    ADDED : 'added',
    CHANGED : 'changed',
    FIXED : 'fixed',
    SECURITY : 'security',
    DEPRECATED : 'deprecated',
    REMOVED : 'removed'
};
