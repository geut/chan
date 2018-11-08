import chan from './chan';
import init from './init';
import change from './change';

export default cli => {
  chan(cli);
  init(cli);
  change(cli);
};
