const pkg = require('./package.json');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const builtins = require('rollup-plugin-node-builtins');

const env = process.env.NODE_ENV || 'production';
// const production = env === 'production';

export default {
  input: './src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: [
    babel({
      exclude: /node_modules/
    }),

    json(),

    builtins(),

    resolve({
      jsnext: true
    }),

    commonjs({
      include: /node_modules/
    }),

    replace({ 'process.env.NODE_ENV': JSON.stringify(env) })

    // production && minify()
  ],

  output: [
    {
      format: 'esm',
      file: pkg.module
    },
    {
      format: 'cjs',
      file: pkg.main
    }
  ]
};
