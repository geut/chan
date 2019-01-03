import chan from './chan';
import init from './init';
import change from './change';
import release from './release';

export default yargs => {
  chan(yargs);
  init(yargs);
  change(yargs);
  release(yargs);
};
