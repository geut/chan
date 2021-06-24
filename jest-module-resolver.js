// temporary workaround while we wait for https://github.com/facebook/jest/issues/9771
const resolver = require('enhanced-resolve').create.sync({
  conditionNames: ['require', 'node', 'default', 'import'],
  extensions: ['.js', '.json', '.node', '.ts']
})


module.exports = function (request, options) {
  if (['fs', 'url', 'path', 'assert'].includes(request)) {
    return options.defaultResolver(request, options);
  }
  return resolver(options.basedir, request)
}
