const LINE = '\n';
const BREAK = LINE + LINE;
const GAP = BREAK + LINE;
const EMPTY = '';

export default function (remark) {
    remark.Compiler.prototype.block = function (node) {
        let self = this;
        let values = [];
        let children = node.children;
        let length = children.length;
        let index = -1;
        let child;
        let prev;

        while (++index < length) {
            child = children[index];

            if (prev) {
                /*
                 * Duplicate nodes, such as a list
                 * directly following another list,
                 * often need multiple new lines.
                 *
                 * Additionally, code blocks following a list
                 * might easily be mistaken for a paragraph
                 * in the list itself.
                 */

                if (child.type === prev.type && prev.type === 'list') {
                    values.push(prev.ordered === child.ordered ? GAP : BREAK);
                } else if (
                    prev.type === 'list' &&
                    child.type === 'code' &&
                    !child.lang
                ) {
                    values.push(GAP);
                } else if (prev.type === 'heading') {
                    if (child.type === 'heading' && prev.depth === 2 && child.depth === 2) {
                        values.push(BREAK);
                    } else {
                        values.push(LINE);
                    }
                } else if (child.type === 'definition') {
                    if (prev.type !== 'definition') {
                        values.push(BREAK);
                    } else {
                        values.push(LINE);
                    }
                } else {
                    values.push(BREAK);
                }
            }

            values.push(self.visit(child, node));

            prev = child;
        }

        return values.join(EMPTY);
    };
}
