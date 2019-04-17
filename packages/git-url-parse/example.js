const gitCompareUrl = require('./');

(async () => {
  console.log(await gitCompareUrl({ url: 'https://github.com/geut/chan' }));
})();
