const gitCompareUrl = require('./');

(async () => {
  console.log(await gitCompareUrl({ prevTag: '0.0.2', nextTag: '0.0.3' }));
})();
