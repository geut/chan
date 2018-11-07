import init from './init';
import chan from './chan';

export default cli => {
  chan(cli);
  init(cli);
};
