import unified from 'unified'
import markdown from 'remark-parse'
import toVFile from 'to-vfile'
import { dirname } from 'dirname-filename-esm'
import { remarkToChan } from '../src/index.js'

test('parse mdast to chast', () => {
  const processor = unified()
    .use(markdown)
    .use(remarkToChan)
    
    const tree = processor.runSync(
      processor.parse(toVFile.readSync(`${dirname(import.meta)}/__files__/CHANGELOG.md`))
    ) 

  expect(tree).toMatchSnapshot();
});
