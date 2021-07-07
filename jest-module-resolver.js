// temporary workaround while we wait for https://github.com/facebook/jest/issues/9771
const resolver = require('enhanced-resolve').create.sync({
  conditionNames: ['require', 'node', 'default', 'import'],
  extensions: ['.js', '.json', '.node', '.ts']
})

module.exports = function (req, options) {
  let request = req
 
  if (req.startsWith('node:')) request = req.substr(5)

  if (['fs', 'url', 'path', 'assert', 'util'] // node imports
  .concat([
    'is-plain-object' // @github/actions consume it from a cjs and `is-plain-object` has multiple builds.
  ]).includes(request)) {
    return options.defaultResolver(request, options);
  }
  return resolver(options.basedir, request)
}
